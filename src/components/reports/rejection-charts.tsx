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
import { DateRange } from "react-day-picker";
import { useQueries } from "@tanstack/react-query";
import qs from "qs";
import { Loader2Icon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/hooks/use-orders";
import { fetchOrders } from "@/services/orders-service";
import { useAuth } from "@/providers/auth-provider";

const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#00C49F", "#8884D8"];
const PAGE_SIZE = 100;

type Props = {
  range: DateRange | undefined;
};

export const RejectionCharts = ({ range }: Props) => {
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

  // 1) первая страница через твой хук
  const {
    data: firstOrders = [],
    total = 0,
    isLoading: firstLoading,
  } = useOrders(1, PAGE_SIZE, filters);

  const pageCount = Math.ceil(total / PAGE_SIZE);

  // те же параметры, что и в хуке
  const ordersQueryString = useMemo(
    () =>
      qs.stringify(
        { filters, sort: ["createdAt:desc"] },
        { encodeValuesOnly: true }
      ),
    [filters]
  );

  // 2) остальные страницы 2..N
  const otherPages = useQueries({
    queries:
      pageCount > 1
        ? Array.from({ length: pageCount - 1 }, (_, i) => {
            const page = i + 2;
            return {
              queryKey: ["orders", page, PAGE_SIZE, filters],
              queryFn: () =>
                fetchOrders(token ?? "", page, PAGE_SIZE, ordersQueryString),
              enabled: !!token && !!filters && total > PAGE_SIZE,
              staleTime: 60_000,
            };
          })
        : [],
  });

  const isLoading = firstLoading || otherPages.some((q) => q.isLoading);

  // 3) собираем полный набор заказов
  const allOrders = useMemo(() => {
    const rest = otherPages.flatMap((q) => q.data?.orders ?? []);
    return [...firstOrders, ...rest];
  }, [firstOrders, otherPages]);

  // 4) агрегации
  const refusalData = useMemo(() => {
    const grouped: Record<string, number> = {};

    allOrders
      .filter((o) => o.orderStatus === "Отказ")
      .forEach((order) => {
        const reason = order.reason_for_refusal || "Без причины";
        grouped[reason] = (grouped[reason] || 0) + 1;
      });

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [allOrders]);

  const sourceData = useMemo(() => {
    const grouped: Record<string, number> = {};

    allOrders.forEach((order) => {
      const source = order.source || "Без источника";
      grouped[source] = (grouped[source] || 0) + 1;
    });

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [allOrders]);

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
