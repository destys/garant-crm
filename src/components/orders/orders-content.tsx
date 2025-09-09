/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";

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

import { generateOrdersReportPdf } from "../pdfs/generate-orders-pdf";

export const OrdersContent = () => {
  const activeTitle =
    useOrderFilterStore((state) => state.activeTitle) || undefined;
  const filters = useOrderFilterStore((state) => state.filters);
  const [period, setPeriod] = useState<{ from?: Date; to?: Date }>({});
  const { user, roleId } = useAuth();

  // локальные фильтры
  const [formFilters, setFormFilters] = useState<Record<string, any>>({});
  const [searchFilter, setSearchFilter] = useState<Record<string, any>>({});

  // пагинация
  const [page, setPage] = useState(1);
  const pageSize = 12;

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

  // ВАЖНО: хук должен возвращать meta.pagination: { page, pageSize, pageCount, total }
  const { data, meta, isLoading, updateOrder, deleteOrder } = useOrders(
    page,
    pageSize,
    finalFilters,
    sortString
  );
  const { users } = useUsers(1, 100);

  // Сбрасываем страницу, когда меняются фильтры или сортировка
  useEffect(() => {
    setPage(1);
  }, [JSON.stringify(finalFilters), JSON.stringify(sortString)]);

  const handleDownloadPdf = () => {
    if (!period.from || !period.to || !data.length) return;
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
            disabled={!period.from || !period.to || !data.length}
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

      {/* Серверная пагинация */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {isLoading
            ? "Загрузка…"
            : total
            ? `${from}–${to} из ${total}`
            : "Нет данных"}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={isLoading || page <= 1}
          >
            Назад
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={isLoading || page >= pageCount}
          >
            Вперёд
          </Button>
        </div>
      </div>
    </div>
  );
};
