"use client";

import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { useQueries } from "@tanstack/react-query";
import qs from "qs";
import { Loader2Icon, PrinterCheckIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/hooks/use-orders";
import { useIncomes } from "@/hooks/use-incomes";
import { useAuth } from "@/providers/auth-provider";
import { fetchOrders } from "@/services/orders-service";
import { fetchIncomes } from "@/services/incomes-service";
import { OrderProps } from "@/types/order.types";
import { IncomeOutcomeProps } from "@/types/income-outcome.types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateMasterReportPdf } from "@/lib/pdf/generate-master-report";
import { Button } from "@/components/ui/button";

interface Props {
  range?: DateRange;
}

const PAGE_SIZE = 100;

export const ServiceReport = ({ range }: Props) => {
  const [service, setService] = useState("all");
  const { jwt: token } = useAuth();

  // ---------- Filters ----------
  const orderFilters = useMemo(() => {
    if (!range?.from || !range?.to) return undefined;
    return {
      $and: [
        { createdAt: { $gte: range.from } },
        { createdAt: { $lte: range.to } },
        ...(service !== "all" ? [{ kind_of_repair: service }] : []),
      ],
    };
  }, [range, service]);

  const accountingFilters = useMemo(() => orderFilters, [orderFilters]);

  // ---------- Data ----------
  const {
    data: firstOrders = [],
    total: ordersTotal = 0,
    isLoading: ordersLoading,
  } = useOrders(1, PAGE_SIZE, orderFilters);

  const {
    incomes: firstIncomes = [],
    total: incomesTotal = 0,
    isLoading: incomesLoading,
  } = useIncomes(1, PAGE_SIZE, accountingFilters);

  const ordersPageCount = Math.ceil(ordersTotal / PAGE_SIZE);
  const incomesPageCount = Math.ceil(incomesTotal / PAGE_SIZE);

  const ordersQueryString = useMemo(
    () =>
      qs.stringify(
        { filters: orderFilters, sort: ["createdAt:desc"] },
        { encodeValuesOnly: true }
      ),
    [orderFilters]
  );

  const incomesQueryString = useMemo(
    () =>
      qs.stringify({ filters: accountingFilters }, { encodeValuesOnly: true }),
    [accountingFilters]
  );

  // ---------- Pagination ----------
  const otherOrdersQueries = useQueries({
    queries:
      ordersPageCount > 1
        ? Array.from({ length: ordersPageCount - 1 }, (_, i) => {
            const page = i + 2;
            return {
              queryKey: ["orders", page, PAGE_SIZE, orderFilters],
              queryFn: () =>
                fetchOrders(token ?? "", page, PAGE_SIZE, ordersQueryString),
              enabled: !!token && !!orderFilters && ordersTotal > PAGE_SIZE,
              staleTime: 60_000,
            };
          })
        : [],
  });

  const otherIncomesQueries = useQueries({
    queries:
      incomesPageCount > 1
        ? Array.from({ length: incomesPageCount - 1 }, (_, i) => {
            const page = i + 2;
            return {
              queryKey: ["incomes", page, PAGE_SIZE, accountingFilters],
              queryFn: () =>
                fetchIncomes(token ?? "", page, PAGE_SIZE, incomesQueryString),
              enabled:
                !!token && !!accountingFilters && incomesTotal > PAGE_SIZE,
              staleTime: 60_000,
            };
          })
        : [],
  });

  // ---------- Combine ----------
  const allOrders: OrderProps[] = useMemo(() => {
    const rest = otherOrdersQueries.flatMap((q) => q.data?.orders ?? []);
    return [...firstOrders, ...rest];
  }, [firstOrders, otherOrdersQueries]);

  const allIncomes: IncomeOutcomeProps[] = useMemo(() => {
    const rest = otherIncomesQueries.flatMap((q) => q.data?.incomes ?? []);
    return [...firstIncomes, ...rest];
  }, [firstIncomes, otherIncomesQueries]);

  const isLoading =
    ordersLoading ||
    incomesLoading ||
    otherOrdersQueries.some((q) => q.isLoading) ||
    otherIncomesQueries.some((q) => q.isLoading);

  // ---------- Statistics ----------
  const openCount = allOrders.filter((o) =>
    [
      "Новая",
      "Согласовать",
      "Отремонтировать",
      "Купить запчасти",
      "Отправить курьера",
    ].includes(o.orderStatus)
  ).length;

  const completedCount = allOrders.filter(
    (o) => o.orderStatus === "Выдан" && o.is_approve === true
  ).length;

  const rejectedCount = allOrders.filter(
    (o) => o.orderStatus === "Отказ" && o.is_approve === true
  ).length;

  const totalIncome = allIncomes.reduce<number>(
    (acc, curr) => acc + (curr.count || 0),
    0
  );

  const statCards = [
    { title: "Открытые", value: openCount },
    { title: "Завершено", value: completedCount },
    { title: "Отказов", value: rejectedCount },
    { title: "Доход", value: `${totalIncome} ₽` },
  ];

  // ---------- Handlers ----------
  const handleDownloadPdf = async () => {
    if (!range?.from || !range?.to) return;
    await generateMasterReportPdf(
      allOrders,
      range.from,
      range.to,
      service !== "all" ? service : "Все сервисы",
      { mode: "download" }
    );
  };

  // ---------- Render ----------
  return (
    <Card>
      <CardHeader>
        <CardTitle>Статистика по сервису</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4">
          {/* Выбор сервиса */}
          <Select value={service} onValueChange={setService}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите сервис" />
            </SelectTrigger>
            <SelectContent className="w-full">
              <SelectGroup>
                <SelectLabel>Сервисы</SelectLabel>
                <SelectItem value="all">Все сервисы</SelectItem>
                <SelectItem value="Выездной">Выездной</SelectItem>
                <SelectItem value="Стационарный">Стационарный</SelectItem>
                <SelectItem value="UMedia">UMedia</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="max-lg:hidden" />
          {/* Кнопка */}
          <Button
            disabled={!range?.from || isLoading}
            onClick={handleDownloadPdf}
          >
            <PrinterCheckIcon className="mr-2 h-4 w-4" />
            {isLoading ? "Подготовка..." : "Скачать отчет в PDF"}
          </Button>
        </div>

        {/* Карточки */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map((stat, i) => (
            <Card key={i} className="flex flex-col max-sm:py-3">
              <CardHeader className="max-sm:px-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-lg sm:text-2xl font-bold max-sm:px-3">
                {isLoading ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  stat.value
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
