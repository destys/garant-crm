/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { pdf } from "@react-pdf/renderer";

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
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { LEGAL_STATUSES } from "@/constants";
import { GenerateOrdersReport } from "@/lib/pdf/generate-orders-report";

export const OrdersContent = () => {
  const activeTitle =
    useOrderFilterStore((state) => state.activeTitle) || undefined;
  const filters = useOrderFilterStore((state) => state.filters);
  const { user, roleId } = useAuth();

  const [period, setPeriod] = useState<{ from?: Date; to?: Date }>({});
  const [formFilters, setFormFilters] = useState<Record<string, any>>({});
  const [searchFilter, setSearchFilter] = useState<Record<string, any>>({});
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

  // ⭐ при изменении адреса (напрямую) обновляем состояние страницы
  useEffect(() => {
    setPage(pageFromUrl);
  }, [pageFromUrl]);

  // ⭐ функция смены страницы
  const pushPage = (next: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(next));
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    setPage(next);
  };

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
  const { data, meta, isLoading, updateOrder, deleteOrder } = useOrders(
    page,
    pageSize,
    finalFilters,
    sortString
  );
  const { users } = useUsers(1, 100);

  // ⭐ при изменении фильтров, поиска и сортировки — сбрасываем страницу в 1
  useEffect(() => {
    pushPage(1);
  }, [JSON.stringify(finalFilters), JSON.stringify(sortString)]);

  const handleDownloadPdf = async () => {
    if (!data?.length) return;

    const blob = await pdf(
      <GenerateOrdersReport title={activeTitle} orders={data} period={period} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Отчет_${activeTitle || "заявки"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
        <h1 className="flex-auto">{activeTitle || "Все заявки"}</h1>

        <div className="flex flex-col sm:flex-row gap-2">
          <SearchBlock onChange={setSearchFilter} />
          <Button
            onClick={handleDownloadPdf}
            disabled={
              ((!period.from || !period.to) && !baseFilters.master) ||
              !data.length
            }
          >
            Скачать отчет в PDF
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
              onClick={() =>
                setLegalFilter((prev) => (prev === status ? null : status))
              }
            >
              {status}
            </Button>
          ))}
        </div>
      )}

      <OrdersFilters
        onChange={(filters: any) => {
          setFormFilters(filters);
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
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-4 mt-10">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {isLoading
            ? "Загрузка…"
            : total
            ? `${from}–${to} из ${total}`
            : "Нет данных"}
        </div>

        <Pagination>
          <PaginationContent className="gap-4">
            <PaginationItem>
              <Button asChild>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isLoading && page > 1) pushPage(page - 1);
                  }}
                  aria-disabled={isLoading || page <= 1}
                  className={
                    isLoading || page <= 1
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </Button>
            </PaginationItem>

            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isLoading && p !== page) pushPage(p);
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <Button asChild>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isLoading && page < pageCount) pushPage(page + 1);
                  }}
                  aria-disabled={isLoading || page >= pageCount}
                  className={
                    isLoading || page >= pageCount
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
