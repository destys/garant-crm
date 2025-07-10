'use client';

import { useOrderFilterStore } from "@/stores/order-filters-store";
import { SearchBlock } from "@/components/search-block";
import { DEMO_DATA } from "@/constants";

import { OrdersFilters } from "./orders-filters";
import { OrdersTable } from "./orders-table";

export const OrdersContent = () => {
    const { activeTitle } = useOrderFilterStore.getState();

    return (
        <div>
            <div className="flex justify-between items-center gap-4 mb-8">
                <h1 className="flex-auto">{activeTitle || "Все заявки"}</h1>
                <SearchBlock />
            </div>
            <OrdersFilters />
            <OrdersTable data={DEMO_DATA} />
        </div>
    )
}
