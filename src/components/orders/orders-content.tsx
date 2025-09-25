/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  PaginationEllipsis,
} from "@/components/ui/pagination";

import { generateOrdersReportPdf } from "../pdfs/generate-orders-pdf";

export const OrdersContent = () => {
  const activeTitle =
    useOrderFilterStore((state) => state.activeTitle) || undefined;
  const filters = useOrderFilterStore((state) => state.filters);
  const [period, setPeriod] = useState<{ from?: Date; to?: Date }>({});
  const { user, roleId } = useAuth();

  // next/navigation
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // локальные фильтры
  const [formFilters, setFormFilters] = useState<Record<string, any>>({});
  const [searchFilter, setSearchFilter] = useState<Record<string, any>>({});

  // Вернуть число из searchParams с дефолтом
  const getInt = (v: string | null, def = 1) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : def;
  };

  // Построить массив элементов пагинации (числа и "…")
  const buildPages = (page: number, pageCount: number, delta = 1) => {
    // Всегда показываем 1, page, page±delta, последнюю; остальное — многоточия
    const range = new Set<number>([1, pageCount]);
    for (let d = -delta; d <= delta; d++) {
      const p = page + d;
      if (p >= 1 && p <= pageCount) range.add(p);
    }
    // Добавим ещё соседей от 1 и от конца, чтобы не было слишком «рвано»
    range.add(2);
    range.add(pageCount - 1);

    const sorted = Array.from(range).sort((a, b) => a - b);
    const items: (number | "...")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      const prev = sorted[i - 1];
      if (i && cur - prev > 1) items.push("...");
      items.push(cur);
    }
    return items.filter(
      (x, i, arr) =>
        // уберём дубликаты и лишние "..." на краях
        arr.indexOf(x) === i &&
        !(x === "..." && (i === 0 || i === arr.length - 1))
    );
  };

  // пагинация: читаем из URL (?page=)
  const pageFromUrl = getInt(searchParams.get("page"), 1);
  const [page, setPage] = useState<number>(pageFromUrl);
  const [pageSize] = useState<number>(12); // если захочешь — тоже вынеси в URL (?limit=)

  // если URL поменялся извне — синхронизируем локальный page
  useEffect(() => {
    setPage(pageFromUrl);
  }, [pageFromUrl]);

  // Переход на страницу: меняем и state, и URL (без прокрутки)
  const pushPage = (next: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(next));
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
    setPage(next);
  };

  // базовые фильтры из стора+локальные
  const baseFilters = useMemo(
    () => ({ ...filters, ...formFilters, ...searchFilter }),
    [filters, formFilters, searchFilter]
  );

  // финальные фильтры с принудительным ограничением для мастера
  const finalFilters = useMemo(() => {
    const result: Record<string, any> = { ...baseFilters };
    const andArr: any[] = Array.isArray(result.$and) ? [...result.$and] : [];
    if (roleId === 1 && user?.id) {
      andArr.push({ master: { $eq: user.id } });
    } else {
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

  // При изменении фильтров/сортировки — уходим на первую страницу (и в URL)
  useEffect(() => {
    // ставим только если сейчас не 1
    if (page !== 1) pushPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(finalFilters), JSON.stringify(sortString)]);

  const handleDownloadPdf = () => {
    if (((!period.from || !period.to) && !baseFilters.master) || !data.length)
      return;
    generateOrdersReportPdf(data, activeTitle, period);
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

      {/* Пагинация: shadcn/ui + URL */}
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

            {buildPages(page, pageCount).map((it, idx) =>
              it === "..." ? (
                <PaginationItem key={`dots-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={it}>
                  <PaginationLink
                    href={`${pathname}?${new URLSearchParams({
                      ...Object.fromEntries(searchParams),
                      page: String(it),
                    }).toString()}`}
                    isActive={it === page}
                    onClick={(e) => {
                      e.preventDefault();
                      if (it !== page && !isLoading) pushPage(it as number);
                    }}
                  >
                    {it}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

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
