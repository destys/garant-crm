'use client';

import { DataTable } from "@/components/data-table"
import { ordersColumns } from "@/components/orders/orders-columns"
import { SectionCards } from "@/components/section-cards"
import { useOrders } from "@/hooks/use-orders";

export default function Page() {
  const { data, isLoading } = useOrders(1, 50);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SectionCards />
      <DataTable data={data} columns={ordersColumns} isLoading={isLoading} />
    </div>
  )
}
