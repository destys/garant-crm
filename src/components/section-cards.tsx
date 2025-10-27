/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { startOfMonth, endOfMonth } from "date-fns";

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

  const { items: currClients } = useAllClients(current);
  const { items: prevClients } = useAllClients(prev);

  const { items: currIncomes } = useAllIncomes(current);
  const { items: prevIncomes } = useAllIncomes(prev);

  const { items: currOutcomes } = useAllOutcomes(current);
  const { items: prevOutcomes } = useAllOutcomes(prev);

  // метрики
  const currentTurnover = currIncomes.reduce((s, i) => s + (i.count || 0), 0);

  const currentRevenue = useMemo(() => {
    const inc = currIncomes.reduce(
      (s: number, i: any) => s + (i.count || 0),
      0
    );
    const out = currOutcomes.reduce(
      (s: number, o: any) => s + (o.count || 0),
      0
    );
    return inc - out;
  }, [currIncomes, currOutcomes]);

  const prevRevenue = useMemo(() => {
    const inc = prevIncomes.reduce(
      (s: number, i: any) => s + (i.count || 0),
      0
    );
    const out = prevOutcomes.reduce(
      (s: number, o: any) => s + (o.count || 0),
      0
    );
    return inc - out;
  }, [prevIncomes, prevOutcomes]);

  const rev = compareValues(currentRevenue, prevRevenue);
  const cust = compareValues(currClients.length, prevClients.length);

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const adSpendMonth = currOutcomes
    .filter(
      (o: any) =>
        o.outcome_category === "Реклама" &&
        new Date(o.createdAt) >= monthStart &&
        new Date(o.createdAt) <= monthEnd
    )
    .reduce((sum: number, o: any) => sum + (o.count || 0), 0);

  const directContactsMonth = currClients.filter(
    (c: any) =>
      c.source === "Директ" &&
      new Date(c.createdAt) >= monthStart &&
      new Date(c.createdAt) <= monthEnd
  );

  const directLeadsMonth = currOrders.filter(
    (o: any) =>
      o.source === "Директ" &&
      o.status !== "Новая" &&
      o.status !== "Отказ" &&
      new Date(o.createdAt) >= monthStart &&
      new Date(o.createdAt) <= monthEnd
  );

  const avgCostPerContact =
    directContactsMonth.length > 0
      ? adSpendMonth / directContactsMonth.length
      : 0;

  const avgCostPerLead =
    directLeadsMonth.length > 0 ? adSpendMonth / directLeadsMonth.length : 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <StatCard
        label="Прибыль за месяц"
        value={`${currentTurnover.toLocaleString()} ₽`}
        percent={rev.percent}
        trend={rev.trend}
        note="Оборот (приходы)"
      />
      <StatCard
        label="Новые клиенты"
        value={currClients.length}
        percent={cust.percent}
        trend={cust.trend}
        note="Клиенты за месяц"
      />
      <StatCard
        label="Ср. цена обращения"
        value={avgCostPerContact.toFixed(0) + " ₽"}
        percent={0}
        trend="up"
        note="За месяц"
      />
      <StatCard
        label="Ср. цена лида"
        value={avgCostPerLead.toFixed(0) + " ₽"}
        percent={0}
        trend="up"
        note="За месяц"
      />
    </div>
  );
}
