"use client";

import { useMemo } from "react";
import { DateRange } from "react-day-picker";
import { useQueries } from "@tanstack/react-query";
import qs from "qs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/hooks/use-orders";
import { useIncomes } from "@/hooks/use-incomes";
import { useOutcomes } from "@/hooks/use-outcomes";
import { fetchOrders } from "@/services/orders-service";
import { fetchIncomes } from "@/services/incomes-service";
import { fetchOutcomes } from "@/services/outcomes-service";
import { useAuth } from "@/providers/auth-provider";

type Props = {
  range: DateRange | undefined;
};

const PAGE_SIZE = 100; // грузим по 100 шт.

export const StatsTiles = ({ range }: Props) => {
  const { jwt: token } = useAuth();

  const filters = useMemo(() => {
    if (!range?.from || !range?.to) return undefined;
    return {
      $and: [
        { createdAt: { $gte: range.from } },
        { createdAt: { $lte: range.to } },
      ],
    };
  }, [range]);

  // 1) Первая страница (через ваши хуки — не меняем их)
  const {
    data: firstOrders = [],
    total: ordersTotal = 0,
    isLoading: ordersLoading,
  } = useOrders(1, PAGE_SIZE, filters);

  const {
    incomes: firstIncomes = [],
    total: incomesTotal = 0,
    isLoading: incomesLoading,
  } = useIncomes(1, PAGE_SIZE, filters);

  const {
    outcomes: firstOutcomes = [],
    total: outcomesTotal = 0,
    isLoading: outcomesLoading,
  } = useOutcomes(1, PAGE_SIZE, filters);

  const ordersPageCount = Math.ceil(ordersTotal / PAGE_SIZE);
  const incomesPageCount = Math.ceil(incomesTotal / PAGE_SIZE);
  const outcomesPageCount = Math.ceil(outcomesTotal / PAGE_SIZE);

  // Строки запросов такие же, как в хуках
  const ordersQueryString = useMemo(
    () =>
      qs.stringify(
        { filters, sort: ["createdAt:desc"] },
        { encodeValuesOnly: true }
      ),
    [filters]
  );

  const incomesQueryString = useMemo(
    () => qs.stringify({ filters }, { encodeValuesOnly: true }),
    [filters]
  );

  const outcomesQueryString = useMemo(
    () => qs.stringify({ filters }, { encodeValuesOnly: true }),
    [filters]
  );

  // 2) Остальные страницы → грузим параллельно прямо из сервисов
  const otherOrdersQueries = useQueries({
    queries:
      ordersPageCount > 1
        ? Array.from({ length: ordersPageCount - 1 }, (_, idx) => {
            const page = idx + 2; // страницы 2..N
            return {
              queryKey: ["orders", page, PAGE_SIZE, filters],
              queryFn: () =>
                fetchOrders(token ?? "", page, PAGE_SIZE, ordersQueryString),
              enabled: !!token && ordersTotal > PAGE_SIZE,
              staleTime: 60_000,
            };
          })
        : [],
  });

  const otherIncomesQueries = useQueries({
    queries:
      incomesPageCount > 1
        ? Array.from({ length: incomesPageCount - 1 }, (_, idx) => {
            const page = idx + 2;
            return {
              queryKey: ["incomes", page, PAGE_SIZE, filters],
              queryFn: () =>
                fetchIncomes(token ?? "", page, PAGE_SIZE, incomesQueryString),
              enabled: !!token && incomesTotal > PAGE_SIZE,
              staleTime: 60_000,
            };
          })
        : [],
  });

  const otherOutcomesQueries = useQueries({
    queries:
      outcomesPageCount > 1
        ? Array.from({ length: outcomesPageCount - 1 }, (_, idx) => {
            const page = idx + 2;
            return {
              queryKey: ["outcomes", page, PAGE_SIZE, filters],
              queryFn: () =>
                fetchOutcomes(
                  token ?? "",
                  page,
                  PAGE_SIZE,
                  outcomesQueryString
                ),
              enabled: !!token && outcomesTotal > PAGE_SIZE,
              staleTime: 60_000,
            };
          })
        : [],
  });

  // 3) Собираем все данные (первая страница + остальные)
  const allOrders = useMemo(() => {
    const rest = otherOrdersQueries.map((q) => q.data?.orders ?? []).flat();
    return [...firstOrders, ...rest];
  }, [firstOrders, otherOrdersQueries]);

  const allIncomes = useMemo(() => {
    const rest = otherIncomesQueries.map((q) => q.data?.incomes ?? []).flat();
    return [...firstIncomes, ...rest];
  }, [firstIncomes, otherIncomesQueries]);

  const allOutcomes = useMemo(() => {
    const rest = otherOutcomesQueries.map((q) => q.data?.outcomes ?? []).flat();
    return [...firstOutcomes, ...rest];
  }, [firstOutcomes, otherOutcomesQueries]);

  // Лоадинг если грузится первая страница или любая из остальных
  const isLoading =
    ordersLoading ||
    incomesLoading ||
    outcomesLoading ||
    otherOrdersQueries.some((q) => q.isLoading) ||
    otherIncomesQueries.some((q) => q.isLoading) ||
    otherOutcomesQueries.some((q) => q.isLoading);

  // 4) Метрики считаем по полному набору
  const stats = useMemo(() => {
    const totalOrders = allOrders.length;

    const completedOrders = allOrders.filter(
      (o) => o.orderStatus === "Выдан" && o.is_approve === true
    ).length;

    const refusedOrders = allOrders.filter(
      (o) => o.orderStatus === "Отказ" && o.is_approve === true
    ).length;

    const refusalRate =
      totalOrders > 0
        ? Math.round((refusedOrders / totalOrders) * 100) + "%"
        : "0%";

    const totalIncome = allIncomes.reduce((s, i) => s + (i.count || 0), 0);
    const totalOutcome = allOutcomes.reduce((s, o) => s + (o.count || 0), 0);
    const profit = totalIncome - totalOutcome;

    return [
      { title: "Всего заказов", value: totalOrders },
      { title: "Завершенных заказов", value: completedOrders },
      { title: "Отказы (%)", value: refusalRate },
      { title: "Прибыль", value: profit + " ₽" },
    ];
  }, [allOrders, allIncomes, allOutcomes]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat, i) => (
        <Card key={i} className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {isLoading ? "…" : stat.value}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
