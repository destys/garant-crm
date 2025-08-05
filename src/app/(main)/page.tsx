'use client';

import { DataTable } from "@/components/data-table"
import { OrdersCard } from "@/components/orders/orders-card";
import { ordersColumns } from "@/components/orders/orders-columns"
import { SectionCards } from "@/components/section-cards"
import { useOrders } from "@/hooks/use-orders";
import { useUsers } from "@/hooks/use-users";

export default function Page() {
  const { data, updateOrder, deleteOrder } = useOrders(1, 50);
  const { users } = useUsers(1, 50);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SectionCards />
      <DataTable
        data={data}
        columns={ordersColumns(users, updateOrder, deleteOrder)}
        cardComponent={({ data }) => <OrdersCard
          data={data} />}
      />
    </div>
  )
}
