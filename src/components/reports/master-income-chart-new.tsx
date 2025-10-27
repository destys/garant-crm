/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DateRange } from "react-day-picker";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import qs from "qs";
import { format } from "date-fns";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useIncomes } from "@/hooks/use-incomes";
import { useAuth } from "@/providers/auth-provider";
import { fetchIncomes } from "@/services/incomes-service";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

type Props = {
  range: DateRange | undefined;
};

const PAGE_SIZE = 100;

export const MasterIncomeChart = ({ range }: Props) => {
  const { jwt: token } = useAuth();

  // --- фильтры по диапазону дат ---
  const filters = useMemo(() => {
    if (!range?.from || !range?.to) return undefined;
    return {
      $and: [
        { createdAt: { $gte: range.from } },
        { createdAt: { $lte: range.to } },
      ],
    };
  }, [range]);

  // --- первая страница через хук ---
  const {
    incomes: firstPage = [],
    total: totalIncomes = 0,
    isLoading: firstLoading,
  } = useIncomes(1, PAGE_SIZE, filters);

  const pageCount = Math.ceil(totalIncomes / PAGE_SIZE);

  const queryString = useMemo(
    () => qs.stringify({ filters }, { encodeValuesOnly: true }),
    [filters]
  );

  // --- остальные страницы ---
  const otherPagesQueries = useQueries({
    queries:
      pageCount > 1
        ? Array.from({ length: pageCount - 1 }, (_, i) => {
            const page = i + 2;
            return {
              queryKey: ["incomes", page, PAGE_SIZE, filters],
              queryFn: () =>
                fetchIncomes(token ?? "", page, PAGE_SIZE, queryString),
              enabled: !!token && totalIncomes > PAGE_SIZE,
              staleTime: 60_000,
            };
          })
        : [],
  });

  const allIncomes = useMemo(() => {
    const rest = otherPagesQueries.flatMap((q) => q.data?.incomes ?? []);
    return [...firstPage, ...rest];
  }, [firstPage, otherPagesQueries]);

  const isLoading = firstLoading || otherPagesQueries.some((q) => q.isLoading);

  // --- группировка: по дням и по мастерам ---
  const chartData = useMemo(() => {
    if (!range?.from || !range?.to) return [];

    const start = new Date(range.from);
    const end = new Date(range.to);
    const dayCount = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    // определяем всех мастеров заранее, без "Без сотрудника"
    const mastersSet = new Set<string>();
    for (const inc of allIncomes) {
      const name = inc.user?.name?.trim();
      if (name && name !== "Без сотрудника") mastersSet.add(name);
    }
    const masters = Array.from(mastersSet);

    const days: Record<string, any> = {};

    for (let i = 0; i <= dayCount; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = format(d, "yyyy-MM-dd");
      days[key] = { date: key };
      masters.forEach((m) => (days[key][m] = 0)); // ← 0 для непрерывности
    }

    for (const income of allIncomes) {
      const masterName = income.user?.name?.trim();
      if (!masterName || masterName === "Без сотрудника") continue;
      const amount = income.count || 0;
      const d = format(new Date(income.createdAt), "yyyy-MM-dd");
      if (!days[d]) continue;
      days[d][masterName] += amount;
    }

    return Object.values(days);
  }, [allIncomes, range]);

  // --- список всех мастеров, чтобы построить линии ---
  const allMasters = useMemo(() => {
    const set = new Set<string>();
    for (const item of allIncomes) {
      const name = item.user?.name?.trim();
      if (name && name !== "Без сотрудника") set.add(name);
    }
    return Array.from(set);
  }, [allIncomes]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color?: string }> = {
      visitors: { label: "Visitors" },
    };

    allMasters.forEach((name, i) => {
      const hue = (i * 37) % 360; // шаг 37° даёт хорошо распределённые цвета
      config[name] = {
        label: name,
        color: `hsl(${hue}, 70%, 55%)`,
      };
    });

    return config as ChartConfig;
  }, [allMasters]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Динамика доходов по мастерам</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(val) => `${val.toLocaleString("ru-RU")}`}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("ru-RU", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("ru-RU", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            {allMasters.map((name) => {
              const color = chartConfig[name]?.color || "hsl(0, 0%, 60%)"; // fallback to gray
              return (
                <Area
                  key={name}
                  dataKey={name}
                  type="monotone"
                  fill={color}
                  stroke={color}
                  fillOpacity={0.25}
                />
              );
            })}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
        {isLoading && (
          <div className="mt-2 text-xs text-muted-foreground">Загрузка…</div>
        )}
      </CardContent>
    </Card>
  );
};
