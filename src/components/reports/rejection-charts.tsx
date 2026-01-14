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

const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#00C49F", "#8884D8"];

export const RejectionCharts = () => {
  const { orders, isLoading } = useReportsData();

  const refusalData = useMemo(() => {
    const grouped: Record<string, number> = {};

    orders
      .filter((o) => o.orderStatus === "Отказ")
      .forEach((order) => {
        const reason = order.reason_for_refusal || "Без причины";
        grouped[reason] = (grouped[reason] || 0) + 1;
      });

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const sourceData = useMemo(() => {
    const grouped: Record<string, number> = {};

    orders.forEach((order) => {
      const source = order.source || "Без источника";
      grouped[source] = (grouped[source] || 0) + 1;
    });

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [orders]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Причины отказов</CardTitle>
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
                  data={refusalData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {refusalData.map((_, index) => (
                    <Cell
                      key={`refusal-${index}`}
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
          <CardTitle>Источники обращений</CardTitle>
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
                  data={sourceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {sourceData.map((_, index) => (
                    <Cell
                      key={`source-${index}`}
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
