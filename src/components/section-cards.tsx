/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";

import { useAllClients } from "@/hooks/use-all-clients";
import { useAllIncomes } from "@/hooks/use-all-incomes";
import { useAllOrders } from "@/hooks/use-all-orders";
import { useAllOutcomes } from "@/hooks/use-all-outcomes";
import { compareValues, getMonthRanges } from "@/lib/utils";

import { StatCard } from "./dashboard/stat-card";

export function SectionCards() {
  const { current, prev } = getMonthRanges();

  // тянем полные наборы по сущностям
  const { items: currOrders } = useAllOrders(current);
  const { items: prevOrders } = useAllOrders(prev);

  const { items: currClients } = useAllClients(current);
  const { items: prevClients } = useAllClients(prev);

  const { items: currIncomes } = useAllIncomes(current);
  const { items: prevIncomes } = useAllIncomes(prev);

  const { items: currOutcomes } = useAllOutcomes(current);
  const { items: prevOutcomes } = useAllOutcomes(prev);

  // метрики
  const currentRevenue = useMemo(() => {
    const inc = currIncomes.reduce((s: number, i: any) => s + (i.count || 0), 0);
    const out = currOutcomes.reduce((s: number, o: any) => s + (o.count || 0), 0);
    return inc - out;
  }, [currIncomes, currOutcomes]);

  const prevRevenue = useMemo(() => {
    const inc = prevIncomes.reduce((s: number, i: any) => s + (i.count || 0), 0);
    const out = prevOutcomes.reduce((s: number, o: any) => s + (o.count || 0), 0);
    return inc - out;
  }, [prevIncomes, prevOutcomes]);

  const rev = compareValues(currentRevenue, prevRevenue);
  const cust = compareValues(currClients.length, prevClients.length);
  const act = compareValues(currOrders.length, prevOrders.length);
  const growth = compareValues(currIncomes.length, prevIncomes.length);

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <StatCard
        label="Общий доход"
        value={`${currentRevenue.toLocaleString()} ₽`}
        percent={rev.percent}
        trend={rev.trend}
        note="Доход за месяц"
      />
      <StatCard
        label="Новые клиенты"
        value={currClients.length}
        percent={cust.percent}
        trend={cust.trend}
        note="Клиенты за месяц"
      />
      <StatCard
        label="Активные заявки"
        value={currOrders.length}
        percent={act.percent}
        trend={act.trend}
        note="Активность за месяц"
      />
      <StatCard
        label="Число оплат"
        value={currIncomes.length}
        percent={growth.percent}
        trend={growth.trend}
        note="Динамика за месяц"
      />
    </div>
  );
}