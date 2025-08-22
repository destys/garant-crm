/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";

import { SearchBlock } from "@/components/search-block";
import { useOrders } from "@/hooks/use-orders";
import { useUsers } from "@/hooks/use-users";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { ordersColumns } from "@/components/orders/orders-columns";
import { OrdersCard } from "@/components/orders/orders-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { useOrderFilterStore } from "@/stores/order-filters-store";
import { useAuth } from "@/providers/auth-provider";

import { generateOrdersReportPdf } from "../pdfs/generate-orders-pdf";

export const OrdersContent = () => {
    const activeTitle = useOrderFilterStore((state) => state.activeTitle);
    const filters = useOrderFilterStore((state) => state.filters);
    const [period, setPeriod] = useState<{ from?: Date; to?: Date }>({});
    const { user, roleId } = useAuth();

    // локальные фильтры
    const [formFilters, setFormFilters] = useState<Record<string, any>>({});
    const [searchFilter, setSearchFilter] = useState<Record<string, any>>({});

    // базовые фильтры из стора+локальные
    const baseFilters = useMemo(() => ({
        ...filters,
        ...formFilters,
        ...searchFilter,
    }), [filters, formFilters, searchFilter]);

    // финальные фильтры с принудительным ограничением для мастера
    const finalFilters = useMemo(() => {
        const result: Record<string, any> = { ...baseFilters };

        // гарантируем массив $and
        const andArr: any[] = Array.isArray(result.$and) ? [...result.$and] : [];

        // убираем возможный корневой master, чтобы не конфликтовал
        if (result.master) delete result.master;

        // если мастер — добавляем условие в $and
        if (roleId === 1 && user?.id) {
            andArr.push({ master: { $eq: user.id } });
        }

        // записываем $and обратно, если есть условия
        if (andArr.length) result.$and = andArr;

        return result;
    }, [baseFilters, roleId, user?.id]);

    const sortString = activeTitle === 'Дедлайны' ? ["deadline:asc"] : undefined;

    const { data, updateOrder, deleteOrder } = useOrders(1, 50, finalFilters, sortString);
    const { users } = useUsers(1, 100);

    const handleDownloadPdf = () => {
        if (!period.from || !period.to || !data.length) return;
        generateOrdersReportPdf(data, period);
    };

    if (!user || !roleId) return <div className="flex justify-center items-center h-96"><Loader2Icon className="animate-spin" /></div>

    return (
        <div>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
                <h1 className="flex-auto">{activeTitle || "Все заявки"}</h1>
                <div className="flex flex-col sm:flex-row gap-2">
                    <SearchBlock onChange={setSearchFilter} />
                    <Button
                        onClick={handleDownloadPdf}
                        disabled={!period.from || !period.to || !data.length}
                    >
                        Скачать отчет в PDF
                    </Button>
                </div>
            </div>

            <OrdersFilters
                onChange={(filters: any) => {
                    setFormFilters(filters);

                    // 1) пробуем взять период из dateVisitRange -> filters.visit_date
                    const vFrom = filters?.visit_date?.$gte
                        ? new Date(filters.visit_date.$gte)
                        : undefined;
                    const vTo = filters?.visit_date?.$lte
                        ? new Date(filters.visit_date.$lte)
                        : undefined;

                    // 2) если его нет — берём из dateRange -> filters.createdAt
                    const cFrom = filters?.createdAt?.$gte
                        ? new Date(filters.createdAt.$gte)
                        : undefined;
                    const cTo = filters?.createdAt?.$lte
                        ? new Date(filters.createdAt.$lte)
                        : undefined;

                    if ((vFrom && vTo) || (vFrom && !vTo) || (!vFrom && vTo)) {
                        setPeriod({ from: vFrom, to: vTo });
                    } else if ((cFrom && cTo) || (cFrom && !cTo) || (!cFrom && cTo)) {
                        setPeriod({ from: cFrom, to: cTo });
                    } else {
                        setPeriod({});
                    }
                }}
            />

            <DataTable
                data={data}
                columns={ordersColumns(users, updateOrder, deleteOrder, undefined, roleId, user)}
                cardComponent={({ data }) => <OrdersCard data={data} />}
            />
        </div>
    );
};