"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { DateRange } from "react-day-picker";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import qs from "qs";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useIncomes } from "@/hooks/use-incomes";
import { useAuth } from "@/providers/auth-provider";
import { fetchIncomes } from "@/services/incomes-service";
import { ChartLegend } from "@/components/ui/chart";

type Props = {
  range: DateRange | undefined;
};

const PAGE_SIZE = 100;

export const MasterIncomeChart = ({ range }: Props) => {
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

  // 1) Первая страница через твой хук (не меняем его)
  const {
    incomes: firstPage = [],
    total: totalIncomes = 0,
    isLoading: firstLoading,
  } = useIncomes(1, PAGE_SIZE, filters);

  const pageCount = Math.ceil(totalIncomes / PAGE_SIZE);

  // Строка запроса — как в хуке
  const queryString = useMemo(
    () => qs.stringify({ filters }, { encodeValuesOnly: true }),
    [filters]
  );

  // 2) Остальные страницы 2..N тянем параллельно через те же сервисы
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

  // 3) Собираем полный массив доходов
  const allIncomes = useMemo(() => {
    const rest = otherPagesQueries.flatMap((q) => q.data?.incomes ?? []);
    return [...firstPage, ...rest];
  }, [firstPage, otherPagesQueries]);

  const isLoading = firstLoading || otherPagesQueries.some((q) => q.isLoading);

  // 4) Группировка по мастерам (по полному набору)
  const data = useMemo(() => {
    const grouped: Record<string, number> = {};

    for (const income of allIncomes) {
      const masterName = income.user?.name || "Без сотрудника";
      const amount = income.count || 0;

      grouped[masterName] = (grouped[masterName] ?? 0) + amount;
    }

    return Object.entries(grouped).map(([name, income]) => ({ name, income }));
  }, [allIncomes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Доход по сотрудникам</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 16, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <ChartLegend />
            <Bar dataKey="income" name="Доход" />
          </BarChart>
        </ResponsiveContainer>
        {isLoading && (
          <div className="mt-2 text-xs text-muted-foreground">Загрузка…</div>
        )}
      </CardContent>
    </Card>
  );
};
