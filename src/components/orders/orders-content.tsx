/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import QueryString from "qs";

import { SearchBlock } from "@/components/search-block";
import { useOrders } from "@/hooks/use-orders";
import { useUsers } from "@/hooks/use-users";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { ordersColumns } from "@/components/orders/orders-columns";
import { OrdersCard } from "@/components/orders/orders-card";
import { Button } from "@/components/ui/button";
import { useOrderFilterStore } from "@/stores/order-filters-store";
import { useAuth } from "@/providers/auth-provider";
import { OrdersTable } from "@/components/orders/orders-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEGAL_STATUSES } from "@/constants";
import { GenerateOrdersReport } from "@/lib/pdf/generate-orders-report";
import { fetchOrders } from "@/services/orders-service";
import { DataLoadingOverlay } from "@/components/data-loading-overlay";

export const OrdersContent = () => {
  const activeTitle =
    useOrderFilterStore((state) => state.activeTitle) || undefined;
  const filters = useOrderFilterStore((state) => state.filters);
  const { user, roleId, jwt } = useAuth();

  const [period, setPeriod] = useState<{ from?: Date; to?: Date }>({});
  const [formFilters, setFormFilters] = useState<Record<string, any>>({});
  const [searchFilter, setSearchFilter] = useState<Record<string, any>>({});
  const searchFilterRef = useRef(searchFilter);
  searchFilterRef.current = searchFilter;
  const [legalFilter, setLegalFilter] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ⭐ извлекаем page из URL
  const getInt = (v: string | null, def = 1) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : def;
  };

  const pageFromUrl = getInt(searchParams.get("page"), 1);
  const [page, setPage] = useState<number>(pageFromUrl);
  const [pageSize] = useState<number>(12);

  // ⭐ при изменении адреса (напрямую или через историю) обновляем состояние страницы
  useEffect(() => {
    setPage(pageFromUrl);
  }, [pageFromUrl]);

  // ⭐ функция смены страницы
  const pushPage = useCallback(
    (next: number) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("page", String(next));
      router.push(`${pathname}?${sp.toString()}`, { scroll: false });
      setPage(next);
    },
    [pathname, router, searchParams]
  );

  const handleSearchFilterChange = useCallback(
    (nextFilter: Record<string, any>) => {
      const hadSearch = Object.keys(searchFilterRef.current).length > 0;
      const hasSearch = Object.keys(nextFilter).length > 0;
      setSearchFilter(nextFilter);
      if (page !== 1 && (hasSearch || (hadSearch && !hasSearch))) {
        pushPage(1);
      }
    },
    [page, pushPage]
  );

  // ----------------------------
  // фильтры
  // ----------------------------
  const baseFilters = useMemo(() => {
    let merged = { ...filters, ...formFilters, ...searchFilter };

    // если поиск → убираем статус
    const hasSearch = !!Object.keys(searchFilter).length;
    if (activeTitle === "Все заявки" && hasSearch && merged?.$and) {
      merged = {
        ...merged,
        $and: merged.$and.filter((cond: any) => !("orderStatus" in cond)),
      };
      if (!merged.$and.length) delete merged.$and;
    }

    // юридический отдел → добавляем фильтр
    if (activeTitle === "Юридический отдел" && legalFilter) {
      const andArr = Array.isArray(merged.$and) ? [...merged.$and] : [];
      andArr.push({ legal_status: { $eq: legalFilter } });
      merged.$and = andArr;
    }

    return merged;
  }, [filters, formFilters, searchFilter, activeTitle, legalFilter]);

  const finalFilters = useMemo(() => {
    const result: Record<string, any> = { ...baseFilters };
    const andArr: any[] = Array.isArray(result.$and) ? [...result.$and] : [];
    if (roleId === 1 && user?.id) {
      andArr.push({ master: { $eq: user.id } });
    } else if (result.master) {
      andArr.push({ master: result.master });
    }
    if (andArr.length) result.$and = andArr;
    if (result.master) delete result.master;
    return result;
  }, [baseFilters, roleId, user?.id]);

  const sortString = activeTitle === "Дедлайны" ? ["deadline:asc"] : undefined;
  const {
    data,
    meta,
    isLoading,
    isFetching,
    updateOrder,
    deleteOrder,
  } = useOrders(page, pageSize, finalFilters, sortString);
  const listBusy = isLoading || isFetching;
  const { users } = useUsers(1, 100);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!jwt) return;
    setIsGeneratingPdf(true);
    try {
      const reportQuery = QueryString.stringify(
        {
          filters: finalFilters,
          sort: sortString ? sortString : ["createdAt:desc"],
        },
        { encodeValuesOnly: true }
      );

      const firstPage = await fetchOrders(jwt, 1, 100, reportQuery);
      const pageCountForReport = firstPage.meta?.pagination?.pageCount ?? 1;
      let allOrders = firstPage.orders;

      if (pageCountForReport > 1) {
        const requests = Array.from({ length: pageCountForReport - 1 }, (_, i) =>
          fetchOrders(jwt, i + 2, 100, reportQuery)
        );
        const pages = await Promise.all(requests);
        allOrders = [firstPage.orders, ...pages.map((p) => p.orders)].flat();
      }

      if (!allOrders.length) {
        return;
      }

      const blob = await pdf(
        <GenerateOrdersReport title={activeTitle} orders={allOrders} period={period} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Отчет_${activeTitle || "заявки"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!user || !roleId) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2Icon className="animate-spin" />
      </div>
    );
  }

  const total = meta?.pagination?.total ?? 0;
  const pageCount = meta?.pagination?.pageCount ?? 1;
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = total ? Math.min(page * pageSize, total) : 0;

  const renderPagination = () => {
    const pages: (number | string)[] = [];
    if (pageCount <= 6) {
      pages.push(...Array.from({ length: pageCount }, (_, i) => i + 1));
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "...", pageCount);
      } else if (page >= pageCount - 2) {
        pages.push(
          1,
          "...",
          pageCount - 3,
          pageCount - 2,
          pageCount - 1,
          pageCount
        );
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", pageCount);
      }
    }
    return pages.map((p, i) => (
      <PaginationItem key={i}>
        {p === "..." ? (
          <span className="px-2">...</span>
        ) : (
          <PaginationLink
            href="#"
            isActive={p === page}
            className="px-2 py-1 text-sm"
            onClick={(e) => {
              e.preventDefault();
              if (!listBusy && p !== page) pushPage(p as number);
            }}
          >
            {p}
          </PaginationLink>
        )}
      </PaginationItem>
    ));
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
        <h1 className="flex-auto">{activeTitle || "Все заявки"}</h1>

        <div className="flex flex-col sm:flex-row gap-2">
          <SearchBlock onChange={handleSearchFilterChange} />
          <Button
            onClick={handleDownloadPdf}
            disabled={
              isGeneratingPdf ||
              ((!period.from || !period.to) && !baseFilters.master) ||
              !data.length
            }
          >
            {isGeneratingPdf ? (
              <>
                <Loader2Icon className="animate-spin mr-2 h-4 w-4" />
                Формирование...
              </>
            ) : (
              "Скачать отчет в PDF"
            )}
          </Button>
        </div>
      </div>

      {/* 🔹 Юридический отдел */}
      {activeTitle === "Юридический отдел" && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {LEGAL_STATUSES.map((status) => (
            <Button
              key={status}
              variant={legalFilter === status ? "default" : "outline"}
              onClick={() => {
                setLegalFilter((prev) => (prev === status ? null : status));
                if (page !== 1) pushPage(1);
              }}
            >
              {status}
            </Button>
          ))}
        </div>
      )}

      <OrdersFilters
        onChange={(filters: any) => {
          setFormFilters(filters);
          if (page !== 1) pushPage(1);
          const vFrom = filters?.visit_date?.$gte
            ? new Date(filters.visit_date.$gte)
            : undefined;
          const vTo = filters?.visit_date?.$lte
            ? new Date(filters.visit_date.$lte)
            : undefined;
          const cFrom = filters?.createdAt?.$gte
            ? new Date(filters.createdAt.$gte)
            : undefined;
          const cTo = filters?.createdAt?.$lte
            ? new Date(filters.createdAt.$lte)
            : undefined;

          if (vFrom || vTo) setPeriod({ from: vFrom, to: vTo });
          else if (cFrom || cTo) setPeriod({ from: cFrom, to: cTo });
          else setPeriod({});
        }}
      />

      <DataLoadingOverlay show={listBusy} minHeight="min-h-[320px]">
        <OrdersTable
          data={data}
          columns={ordersColumns(
            users,
            updateOrder,
            deleteOrder,
            undefined,
            roleId,
            user
          )}
          cardComponent={({ data }) => <OrdersCard data={data} />}
          isLoading={listBusy}
        />
      </DataLoadingOverlay>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-4 mt-10">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {listBusy
            ? "Загрузка…"
            : total
            ? `${from}–${to} из ${total}`
            : "Нет данных"}
        </div>

        <div className="max-md:flex gap-3">
          <div className="block md:hidden w-full">
            <Select
              value={String(page)}
              onValueChange={(val) => {
                const num = Number(val);
                if (!isNaN(num)) pushPage(num);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите страницу" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    Стр. {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Pagination>
            <PaginationContent className="gap-2 overflow-x-auto">
              {renderPagination()}
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};
