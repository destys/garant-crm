"use client";

import { useMemo } from "react";
import { Loader2Icon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportsData } from "./reports-data-provider";

export const StatsTiles = () => {
  const { orders, incomes, outcomes, isLoading } = useReportsData();

  const stats = useMemo(() => {
    const totalOrders = orders.length;

    const completedOrders = orders.filter(
      (o) => o.orderStatus === "Выдан" && o.is_approve === true
    ).length;

    const refusedOrders = orders.filter(
      (o) => o.orderStatus === "Отказ" && o.is_approve === true
    ).length;

    const refusalRate =
      totalOrders > 0
        ? Math.round((refusedOrders / totalOrders) * 100) + "%"
        : "0%";

    const totalIncome = incomes.reduce((s, i) => s + (i.count || 0), 0);
    const totalOutcome = outcomes.reduce((s, o) => s + (o.count || 0), 0);
    const profit = totalIncome - totalOutcome;

    return [
      { title: "Всего заказов", value: totalOrders },
      { title: "Завершенных заказов", value: completedOrders },
      { title: "Отказы (%)", value: refusalRate },
      { title: "Прибыль", value: profit.toLocaleString() + " ₽" },
    ];
  }, [orders, incomes, outcomes]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat, i) => (
        <Card key={i} className="flex flex-col max-sm:py-3">
          <CardHeader className="max-sm:px-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg sm:text-2xl font-bold max-sm:px-3">
            {isLoading ? (
              <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              stat.value
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
