'use client';

import { jsPDF } from "jspdf";
import { useState } from "react";

import { SearchBlock } from "@/components/search-block";
import { useOrders } from "@/hooks/use-orders";
import { useUsers } from "@/hooks/use-users";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { ordersColumns } from "@/components/orders/orders-columns";
import { OrdersCard } from "@/components/orders/orders-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { useOrderFilterStore } from "@/stores/order-filters-store";

export const OrdersContent = () => {
    const activeTitle = useOrderFilterStore((state) => state.activeTitle);
    const filters = useOrderFilterStore((state) => state.filters);

    // локальные фильтры
    const [formFilters, setFormFilters] = useState({});
    const [searchFilter, setSearchFilter] = useState({});

    const filtersMerge = {
        ...filters,
        ...formFilters,
        ...searchFilter,
    };

    const sortString = activeTitle === 'Дедлайны' ? ["deadline:asc"] : "";

    const { data, updateOrder, deleteOrder } = useOrders(1, 50, filtersMerge, sortString);
    const { users } = useUsers(1, 100);

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        doc.save("orders-report.pdf");
    };

    return (
        <div>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
                <h1 className="flex-auto">{activeTitle || "Все заявки"}</h1>
                <div className="flex flex-col sm:flex-row gap-2">
                    <SearchBlock onChange={setSearchFilter} />
                    <Button onClick={handleDownloadPdf}>Скачать отчет в PDF</Button>
                </div>
            </div>

            <OrdersFilters onChange={setFormFilters} />

            <DataTable
                data={data}
                columns={ordersColumns(users, updateOrder, deleteOrder)}
                cardComponent={({ data }) => <OrdersCard data={data} />}
            />
        </div>
    );
};