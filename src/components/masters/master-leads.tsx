'use client'

import { demoOrders } from '@/demo-data'

import { OrdersFilters } from '../orders/orders-filters'
import { DataTable } from '../data-table'
import { ordersColumns } from '../orders/orders-columns'
import { OrdersCard } from '../orders/orders-card'

export const MasterLeads = () => {
    return (
        <div>
            <OrdersFilters />
            <DataTable
                data={demoOrders}
                columns={ordersColumns}
                cardComponent={({ data }) => (
                    <OrdersCard data={data} />
                )}
            />
        </div>
    )
}
