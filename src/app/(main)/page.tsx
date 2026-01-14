"use client";

import { useMemo } from "react";
import { Loader2Icon } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { OrdersCard } from "@/components/orders/orders-card";
import { ordersColumns } from "@/components/orders/orders-columns";
import { SectionCards } from "@/components/section-cards";
import { useOrders } from "@/hooks/use-orders";
import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/providers/auth-provider";
import { ReportsContent } from "@/components/reports/reports-content";

export default function Page() {
  const { user, roleId } = useAuth();

  // если роль — мастер (1), показываем только его заказы
  const filters = useMemo(() => {
    if (roleId === 1 && user?.id) {
      return { $and: [{ master: { $eq: user.id } }] };
    }
    return {};
  }, [roleId, user?.id]);

  const { data, updateOrder, deleteOrder, isLoading } = useOrders(
    1,
    50,
    filters
  );
  const { users } = useUsers(1, 50);

  if (!user || !roleId)
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2Icon className="animate-spin" />
      </div>
    );

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {roleId === 3 && <SectionCards />}

      {roleId === 3 && <ReportsContent />}

      {roleId === 1 && (
        <DataTable
          data={data}
          columns={ordersColumns(
            users,
            updateOrder,
            deleteOrder,
            undefined,
            roleId,
            user
          )}
          cardComponent={({ data }) => <OrdersCard data={data} />}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
