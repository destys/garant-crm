"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Loader2Icon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useReportsData } from "./reports-data-provider";

const COLORS = ["#4ade80", "#f87171", "#60a5fa", "#facc15", "#a78bfa"];

export const IncomeExpenseChart = () => {
  const { incomes, outcomes, isLoading } = useReportsData();

  const groupedIncomes = useMemo(() => {
    const result: Record<string, number> = {};
    for (const income of incomes) {
      const category = income.income_category || "Без категории";
      const amount = income.count || 0;
      result[category] = (result[category] || 0) + amount;
    }

    return Object.entries(result).map(([income_category, count]) => ({
      income_category,
      count,
    }));
  }, [incomes]);

  const groupedOutcomes = useMemo(() => {
    const result: Record<string, number> = {};
    for (const outcome of outcomes) {
      const category = outcome.outcome_category || "Без категории";
      const amount = outcome.count || 0;
      result[category] = (result[category] || 0) + amount;
    }

    return Object.entries(result).map(([outcome_category, count]) => ({
      outcome_category,
      count,
    }));
  }, [outcomes]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Доходы</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[350px]">
              <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Расходы</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[350px]">
              <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};
