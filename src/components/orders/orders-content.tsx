'use client';

import { jsPDF } from "jspdf";

import { useOrderFilterStore } from "@/stores/order-filters-store";
import { SearchBlock } from "@/components/search-block";
import { demoOrders } from "@/demo-data";

import { DataTable } from "../data-table";
import { Button } from "../ui/button";

import { OrdersFilters } from "./orders-filters";
import { ordersColumns } from "./orders-columns";
import { OrdersCard } from "./orders-card";

export const OrdersContent = () => {
    const { activeTitle } = useOrderFilterStore.getState();

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
                    <Button onClick={handleDownloadPdf}
                    >
                        Скачать отчет в PDF
                    </Button>
                </div>
            </div>
            <OrdersFilters />
            <DataTable
                data={demoOrders}
                columns={ordersColumns}
                cardComponent={({ data }) => (
                    <OrdersCard data={data} />
                )}
            />
        </div >
    )
}
