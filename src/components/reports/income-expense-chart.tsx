"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { DateRange } from "react-day-picker";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import qs from "qs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIncomes } from "@/hooks/use-incomes";
import { useOutcomes } from "@/hooks/use-outcomes";
import { useAuth } from "@/providers/auth-provider";
import { fetchIncomes } from "@/services/incomes-service";
import { fetchOutcomes } from "@/services/outcomes-service";

const PAGE_SIZE = 100;

const COLORS = ["#4ade80", "#f87171", "#60a5fa", "#facc15", "#a78bfa"];

type Props = {
  range: DateRange | undefined;
};

export const IncomeExpenseChart = ({ range }: Props) => {
  const filters = useMemo(() => {
    if (!range?.from || !range?.to) return undefined;
    return {
      $and: [
        { createdAt: { $gte: range.from } },
        { createdAt: { $lte: range.to } },
      ],
    };
  }, [range]);

  const { jwt: token } = useAuth();

  const { incomes: firstIncomes = [], total: incomesTotal = 0 } = useIncomes(
    1,
    PAGE_SIZE,
    filters
  );
  const { outcomes: firstOutcomes = [], total: outcomesTotal = 0 } =
    useOutcomes(1, PAGE_SIZE, filters);

  const incomesPageCount = Math.ceil(incomesTotal / PAGE_SIZE);
  const outcomesPageCount = Math.ceil(outcomesTotal / PAGE_SIZE);

  const incomesQueryString = useMemo(
    () => qs.stringify({ filters }, { encodeValuesOnly: true }),
    [filters]
  );
  const outcomesQueryString = useMemo(
    () => qs.stringify({ filters }, { encodeValuesOnly: true }),
    [filters]
  );

  const otherIncomesQueries = useQueries({
    queries:
      incomesPageCount > 1
        ? Array.from({ length: incomesPageCount - 1 }, (_, i) => {
            const page = i + 2;
            return {
              queryKey: ["incomes", page, PAGE_SIZE, filters],
              queryFn: () =>
                fetchIncomes(token ?? "", page, PAGE_SIZE, incomesQueryString),
              enabled: !!token && incomesTotal > PAGE_SIZE,
              staleTime: 60000,
            };
          })
        : [],
  });

  const otherOutcomesQueries = useQueries({
    queries:
      outcomesPageCount > 1
        ? Array.from({ length: outcomesPageCount - 1 }, (_, i) => {
            const page = i + 2;
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
              staleTime: 60000,
            };
          })
        : [],
  });

  const allIncomes = useMemo(() => {
    const rest = otherIncomesQueries.map((q) => q.data?.incomes ?? []).flat();
    return [...firstIncomes, ...rest];
  }, [firstIncomes, otherIncomesQueries]);

  const allOutcomes = useMemo(() => {
    const rest = otherOutcomesQueries.map((q) => q.data?.outcomes ?? []).flat();
    return [...firstOutcomes, ...rest];
  }, [firstOutcomes, otherOutcomesQueries]);

  const groupedIncomes = useMemo(() => {
    const result: Record<string, number> = {};
    for (const income of allIncomes) {
      const category = income.income_category || "Без категории";
      const amount = income.count || 0;
      result[category] = (result[category] || 0) + amount;
    }

    return Object.entries(result).map(([income_category, count]) => ({
      income_category,
      count,
    }));
  }, [allIncomes]);

  const groupedOutcomes = useMemo(() => {
    const result: Record<string, number> = {};
    for (const outcome of allOutcomes) {
      const category = outcome.outcome_category || "Без категории";
      const amount = outcome.count || 0;
      result[category] = (result[category] || 0) + amount;
    }

    return Object.entries(result).map(([outcome_category, count]) => ({
      outcome_category,
      count,
    }));
  }, [allOutcomes]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Доходы</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={groupedIncomes}
                dataKey="count"
                nameKey="income_category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {groupedIncomes.map((_, index) => (
                  <Cell
                    key={`income-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Расходы</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={groupedOutcomes}
                dataKey="count"
                nameKey="outcome_category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {groupedOutcomes.map((_, index) => (
                  <Cell
                    key={`expense-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
