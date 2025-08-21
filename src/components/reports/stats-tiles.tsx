'use client';

import { useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { useQueries } from '@tanstack/react-query';
import qs from 'qs';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrders } from '@/hooks/use-orders';
import { useClients } from '@/hooks/use-clients';
import { fetchOrders } from '@/services/orders-service';
import { fetchClients } from '@/services/clients-service';
import { useAuth } from '@/providers/auth-provider';

type Props = {
    range: DateRange | undefined;
};

const PAGE_SIZE = 100; // грузим по 100 шт.

export const StatsTiles = ({ range }: Props) => {
    const { jwt: token } = useAuth();

    const filters = useMemo(() => {
        if (!range?.from || !range?.to) return undefined;
        return {
            $and: [
                { createdAt: { $gte: range.from } },
                { createdAt: { $lte: range.to } },
            ],
        };
    }, [range]);

    // 1) Первая страница (через ваши хуки — не меняем их)
    const {
        data: firstOrders = [],
        total: ordersTotal = 0,
        isLoading: ordersLoading,
    } = useOrders(1, PAGE_SIZE, filters);

    const {
        clients: firstClients = [],
        total: clientsTotal = 0,
        isLoading: clientsLoading,
    } = useClients(1, PAGE_SIZE, filters);

    const ordersPageCount = Math.ceil(ordersTotal / PAGE_SIZE);
    const clientsPageCount = Math.ceil(clientsTotal / PAGE_SIZE);

    // Строки запросов такие же, как в хуках
    const ordersQueryString = useMemo(
        () =>
            qs.stringify(
                { filters, sort: ['createdAt:desc'] },
                { encodeValuesOnly: true }
            ),
        [filters]
    );

    const clientsQueryString = useMemo(
        () => qs.stringify({ filters }, { encodeValuesOnly: true }),
        [filters]
    );

    // 2) Остальные страницы → грузим параллельно прямо из сервисов
    const otherOrdersQueries = useQueries({
        queries:
            ordersPageCount > 1
                ? Array.from({ length: ordersPageCount - 1 }, (_, idx) => {
                    const page = idx + 2; // страницы 2..N
                    return {
                        queryKey: ['orders', page, PAGE_SIZE, filters],
                        queryFn: () =>
                            fetchOrders(token ?? '', page, PAGE_SIZE, ordersQueryString),
                        enabled: !!token && ordersTotal > PAGE_SIZE,
                        staleTime: 60_000,
                    };
                })
                : [],
    });

    const otherClientsQueries = useQueries({
        queries:
            clientsPageCount > 1
                ? Array.from({ length: clientsPageCount - 1 }, (_, idx) => {
                    const page = idx + 2;
                    return {
                        queryKey: ['clients', page, PAGE_SIZE, filters],
                        queryFn: () =>
                            fetchClients(token ?? '', page, PAGE_SIZE, clientsQueryString),
                        enabled: !!token && clientsTotal > PAGE_SIZE,
                        staleTime: 60_000,
                    };
                })
                : [],
    });

    // 3) Собираем все данные (первая страница + остальные)
    const allOrders = useMemo(() => {
        const rest = otherOrdersQueries
            .map((q) => q.data?.orders ?? [])
            .flat();
        return [...firstOrders, ...rest];
    }, [firstOrders, otherOrdersQueries]);

    const allClients = useMemo(() => {
        const rest = otherClientsQueries
            .map((q) => q.data?.clients ?? [])
            .flat();
        return [...firstClients, ...rest];
    }, [firstClients, otherClientsQueries]);

    // Лоадинг если грузится первая страница или любая из остальных
    const isLoading =
        ordersLoading ||
        clientsLoading ||
        otherOrdersQueries.some((q) => q.isLoading) ||
        otherClientsQueries.some((q) => q.isLoading);

    // 4) Метрики считаем по полному набору
    const stats = useMemo(() => {
        const totalOrders = allOrders.length;

        const completedOrders = allOrders.filter(
            (o) => o.orderStatus === 'Выдан' && o.is_approve === true
        ).length;

        const refusedOrders = allOrders.filter(
            (o) => o.orderStatus === 'Отказ' && o.is_approve === true
        ).length;

        const refusalRate =
            totalOrders > 0
                ? Math.round((refusedOrders / totalOrders) * 100) + '%'
                : '0%';

        return [
            { title: 'Всего заказов', value: totalOrders },
            { title: 'Новых клиентов', value: allClients.length },
            { title: 'Завершенных заказов', value: completedOrders },
            { title: 'Отказы (%)', value: refusalRate },
        ];
    }, [allOrders, allClients]);

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat, i) => (
                <Card key={i} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">
                        {isLoading ? "…" : stat.value}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}