'use client';

import { useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Check, ChevronsUpDown, PrinterCheckIcon } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import qs from 'qs';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/use-users';
import { useOrders } from '@/hooks/use-orders';
import { useIncomes } from '@/hooks/use-incomes';
import { useAuth } from '@/providers/auth-provider';
import { fetchOrders } from '@/services/orders-service';
import { fetchIncomes } from '@/services/incomes-service';

import { generateMasterReportPdf } from '../pdfs/generate-master-report-pdf';

type Props = {
    range: DateRange | undefined;
};

const PAGE_SIZE = 100;

export const MasterReport = ({ range }: Props) => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);

    const { users } = useUsers(1, 50);
    const { jwt: token } = useAuth();

    const orderFilters = useMemo(() => {
        if (!range?.from || !range?.to || !selected) return undefined;
        return {
            $and: [
                { createdAt: { $gte: range.from } },
                { createdAt: { $lte: range.to } },
                { master: { id: { $eq: Number(selected) } } },
            ],
        };
    }, [range, selected]);

    const accountingFilters = useMemo(() => {
        if (!range?.from || !range?.to || !selected) return undefined;
        return {
            $and: [
                { createdAt: { $gte: range.from } },
                { createdAt: { $lte: range.to } },
                { user: { id: { $eq: Number(selected) } } },
            ],
        };
    }, [range, selected]);

    // 1) Первая страница через ваши хуки
    const {
        data: firstOrders = [],
        total: ordersTotal = 0,
        isLoading: ordersLoading,
    } = useOrders(1, PAGE_SIZE, orderFilters);

    const {
        incomes: firstIncomes = [],
        total: incomesTotal = 0,
        isLoading: incomesLoading,
    } = useIncomes(1, PAGE_SIZE, accountingFilters);

    const ordersPageCount = Math.ceil(ordersTotal / PAGE_SIZE);
    const incomesPageCount = Math.ceil(incomesTotal / PAGE_SIZE);

    // Те же строки запроса, что внутри хуков
    const ordersQueryString = useMemo(
        () =>
            qs.stringify(
                { filters: orderFilters, sort: ['createdAt:desc'] },
                { encodeValuesOnly: true }
            ),
        [orderFilters]
    );

    const incomesQueryString = useMemo(
        () => qs.stringify({ filters: accountingFilters }, { encodeValuesOnly: true }),
        [accountingFilters]
    );

    // 2) Остальные страницы 2..N — через useQueries + сервисы
    const otherOrdersQueries = useQueries({
        queries:
            selected && ordersPageCount > 1
                ? Array.from({ length: ordersPageCount - 1 }, (_, i) => {
                    const page = i + 2;
                    return {
                        queryKey: ['orders', page, PAGE_SIZE, orderFilters],
                        queryFn: () => fetchOrders(token ?? '', page, PAGE_SIZE, ordersQueryString),
                        enabled: !!token && !!orderFilters && ordersTotal > PAGE_SIZE,
                        staleTime: 60_000,
                    };
                })
                : [],
    });

    const otherIncomesQueries = useQueries({
        queries:
            selected && incomesPageCount > 1
                ? Array.from({ length: incomesPageCount - 1 }, (_, i) => {
                    const page = i + 2;
                    return {
                        queryKey: ['incomes', page, PAGE_SIZE, accountingFilters],
                        queryFn: () => fetchIncomes(token ?? '', page, PAGE_SIZE, incomesQueryString),
                        enabled: !!token && !!accountingFilters && incomesTotal > PAGE_SIZE,
                        staleTime: 60_000,
                    };
                })
                : [],
    });

    // 3) Собираем полный массив
    const allOrders = useMemo(() => {
        const rest = otherOrdersQueries.flatMap((q) => q.data?.orders ?? []);
        return [...firstOrders, ...rest];
    }, [firstOrders, otherOrdersQueries]);

    const allIncomes = useMemo(() => {
        const rest = otherIncomesQueries.flatMap((q) => q.data?.incomes ?? []);
        return [...firstIncomes, ...rest];
    }, [firstIncomes, otherIncomesQueries]);

    const isLoading =
        ordersLoading ||
        incomesLoading ||
        otherOrdersQueries.some((q) => q.isLoading) ||
        otherIncomesQueries.some((q) => q.isLoading);

    // 4) Статистика по полному набору
    const openCount = allOrders.filter((o) =>
        ['Новая', 'Согласовать', 'Отремонтировать', 'Купить запчасти', 'Отправить курьера'].includes(o.orderStatus)
    ).length;

    const completedCount = allOrders.filter(
        (o) => o.orderStatus === 'Выдан' && o.is_approve === true
    ).length;

    const rejectedCount = allOrders.filter(
        (o) => o.orderStatus === 'Отказ' && o.is_approve === true
    ).length;

    const totalIncome = allIncomes.reduce((acc, curr) => acc + (curr.count || 0), 0);

    const statCards = [
        { title: 'Открытые', value: openCount },
        { title: 'Завершено', value: completedCount },
        { title: 'Отказов', value: rejectedCount },
        { title: 'Доход', value: `${totalIncome} ₽` },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Статистика по мастеру</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid grid-cols-3 gap-4">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                                {selected ? users.find((m) => m.id.toString() === selected)?.name : 'Выберите мастера'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput placeholder="Поиск мастера..." />
                                <CommandEmpty>Не найдено</CommandEmpty>
                                <CommandGroup>
                                    {users.map((m) => (
                                        <CommandItem
                                            key={m.id}
                                            value={m.id.toString()}
                                            onSelect={(value) => {
                                                setSelected(value === selected ? null : value);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn('mr-2 h-4 w-4', selected === m.id.toString() ? 'opacity-100' : 'opacity-0')}
                                            />
                                            {m.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <div />

                    <Button
                        disabled={!selected || !range?.from || isLoading}
                        onClick={() => {
                            if (range?.from && range?.to) {
                                // В PDF отдаём полный набор заказов
                                generateMasterReportPdf(allOrders, range.from, range.to);
                            }
                        }}
                    >
                        <PrinterCheckIcon className="mr-2 h-4 w-4" />
                        Скачать отчет в pdf
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {statCards.map((stat, i) => (
                        <Card key={i} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-2xl font-bold">
                                {!selected ? '—' : isLoading ? '…' : stat.value}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};