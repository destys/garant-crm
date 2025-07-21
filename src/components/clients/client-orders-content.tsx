'use client';

import { jsPDF } from "jspdf";

import { SearchBlock } from "@/components/search-block";
import { demoOrders } from "@/demo-data";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { ordersColumns } from "@/components/orders/orders-columns";
import { OrdersCard } from "@/components/orders/orders-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";

export const ClientOrdersContent = () => {

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        doc.save("orders-report.pdf");
    };

    return (
        <div>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
                <h1 className="flex-auto">Клиент: Иванов Иван Иванович</h1>
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
