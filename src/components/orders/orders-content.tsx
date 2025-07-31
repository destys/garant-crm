'use client';

import { jsPDF } from "jspdf";

import { useOrderFilterStore } from "@/stores/order-filters-store";
import { SearchBlock } from "@/components/search-block";
import { useOrders } from "@/hooks/use-orders";

import { DataTable } from "../data-table";
import { Button } from "../ui/button";

import { OrdersFilters } from "./orders-filters";
import { ordersColumns } from "./orders-columns";
import { OrdersCard } from "./orders-card";

export const OrdersContent = () => {
    const activeTitle = useOrderFilterStore((state) => state.activeTitle);
    const filters = useOrderFilterStore((state) => state.filters);

    // Формируем query для useOrders
    const query = {
        filters: {
            ...(filters.search
                ? {
                    $or: [
                        { title: { $containsi: filters.search } },
                        { client: { phone: { $containsi: filters.search } } },
                    ],
                }
                : {}),
            ...(filters.master ? { master: { id: filters.master } } : {}),
            ...(filters.dateRange?.from || filters.dateRange?.to
                ? {
                    createdAt: {
                        ...(filters.dateRange.from
                            ? { $gte: filters.dateRange.from.toISOString() }
                            : {}),
                        ...(filters.dateRange.to
                            ? { $lte: filters.dateRange.to.toISOString() }
                            : {}),
                    },
                }
                : {}),
        },
    };

    const { data } = useOrders(1, 50, query);

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        doc.save("orders-report.pdf");
    };

    return (
        <div>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
                <h1 className="flex-auto">{activeTitle || "Все заявки"}</h1>
                <div className="flex flex-col sm:flex-row gap-2">
                    <SearchBlock />
                    <Button onClick={handleDownloadPdf}>Скачать отчет в PDF</Button>
                </div>
            </div>
            <OrdersFilters />
            <DataTable
                data={data}
                columns={ordersColumns}
                cardComponent={({ data }) => <OrdersCard data={data} />}
            />
        </div>
    );
};