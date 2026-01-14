/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { format } from "date-fns";
import { Loader2Icon } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useReportsData } from "./reports-data-provider";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

export const MasterIncomeChart = () => {
  const { incomes, range, isLoading } = useReportsData();

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
    for (const inc of incomes) {
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

    for (const income of incomes) {
      const masterName = income.user?.name?.trim();
      if (!masterName || masterName === "Без сотрудника") continue;
      const amount = income.count || 0;
      const dateField = income.createdDate || income.createdAt;
      if (!dateField) continue;
      const d = format(new Date(dateField), "yyyy-MM-dd");
      if (!days[d]) continue;
      days[d][masterName] += amount;
    }

    return Object.values(days);
  }, [incomes, range]);

  // --- список всех мастеров, чтобы построить линии ---
  const allMasters = useMemo(() => {
    const set = new Set<string>();
    for (const item of incomes) {
      const name = item.user?.name?.trim();
      if (name && name !== "Без сотрудника") set.add(name);
    }
    return Array.from(set);
  }, [incomes]);

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
        {isLoading ? (
          <div className="flex items-center justify-center h-[250px]">
            <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
};
