'use client'

import { useState } from 'react'

import { UserProps } from '@/types/user.types'
import { useUsers } from '@/hooks/use-users'
import { useOrders } from '@/hooks/use-orders'
import { useUser } from '@/hooks/use-user'

import { OrdersFilters } from '../orders/orders-filters'
import { DataTable } from '../data-table'
import { ordersColumns } from '../orders/orders-columns'
import { OrdersCard } from '../orders/orders-card'

export const MasterLeads = ({ data }: { data: UserProps }) => {
    const [formFilters, setFormFilters] = useState({});
    const filters = {
        master: data.id,
        ...formFilters,
    };
    const { updateOrder, deleteOrder } = useOrders(1, 50, filters);
    const { users } = useUsers(1, 50);
    const { data: user, refetch } = useUser(data.id);

    return (
        <div>
            <OrdersFilters onChange={setFormFilters} />
            <DataTable
                data={user?.orders ?? []}
                columns={ordersColumns(users, updateOrder, deleteOrder, refetch)}
                cardComponent={({ data }) => (
                    <OrdersCard data={data} />
                )}
            />
        </div>
    )
}
