'use client';

import { useOrderFilterStore } from "@/stores/order-filters-store";
import { SearchBlock } from "@/components/search-block";
import { demoOrders } from "@/demo-data";

import { DataTable } from "../data-table";

import { OrdersFilters } from "./orders-filters";
import { ordersColumns } from "./orders-columns";

export const OrdersContent = () => {
    const { activeTitle } = useOrderFilterStore.getState();

    return (
        <div>
            <div className="flex justify-between items-center gap-4 mb-8">
                <h1 className="flex-auto">{activeTitle || "Все заявки"}</h1>
                <SearchBlock />
            </div>
            <OrdersFilters />
            <DataTable data={demoOrders} columns={ordersColumns} />
        </div>
    )
}
