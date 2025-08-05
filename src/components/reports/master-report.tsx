'use client'

import { useMemo, useState } from 'react'
import { DateRange } from 'react-day-picker'
import { Check, ChevronsUpDown, PrinterCheckIcon } from 'lucide-react'

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUsers } from '@/hooks/use-users'
import { useOrders } from '@/hooks/use-orders'
import { useIncomes } from '@/hooks/use-incomes'

import { generateMasterReportPdf } from '../pdfs/generate-master-report-pdf'

type Props = {
    range: DateRange | undefined
}

export const MasterReport = ({ range }: Props) => {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<string | null>(null)

    const { users } = useUsers(1, 50)

    const orderFilters = useMemo(() => {
        if (!range?.from || !range?.to || !selected) return undefined
        return {
            $and: [
                { createdAt: { $gte: range.from } },
                { createdAt: { $lte: range.to } },
                { master: { id: { $eq: Number(selected) } } },
            ],
        }
    }, [range, selected])

    const accountingFilters = useMemo(() => {
        if (!range?.from || !range?.to || !selected) return undefined
        return {
            $and: [
                { createdAt: { $gte: range.from } },
                { createdAt: { $lte: range.to } },
                { user: { id: { $eq: Number(selected) } } },
            ],
        }
    }, [range, selected])

    const { data: orders = [] } = useOrders(1, 500, orderFilters)
    const { incomes = [] } = useIncomes(1, 500, accountingFilters)

    const openCount = orders.filter((o) =>
        ['Новая', 'Согласовать', 'Отремонтировать', 'Купить запчасти', 'Отправить курьера'].includes(o.orderStatus)
    ).length

    const completedCount = orders.filter(
        (o) => o.orderStatus === 'Выдан' && o.is_approve === true
    ).length

    const rejectedCount = orders.filter(
        (o) => o.orderStatus === 'Отказ' && o.is_approve === true
    ).length

    const totalIncome = incomes.reduce((acc, curr) => acc + (curr.count || 0), 0)

    const statCards = [
        { title: 'Открытые', value: openCount },
        { title: 'Завершено', value: completedCount },
        { title: 'Отказов', value: rejectedCount },
        { title: 'Доход', value: `${totalIncome} ₽` },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Статистика по мастеру</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid grid-cols-3 gap-4">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between"
                            >
                                {selected
                                    ? users.find((m) => m.id.toString() === selected)?.name
                                    : 'Выберите мастера'}
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
                                                setSelected(value === selected ? null : value)
                                                setOpen(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    selected === m.id.toString()
                                                        ? 'opacity-100'
                                                        : 'opacity-0'
                                                )}
                                            />
                                            {m.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <div></div>

                    <Button
                        disabled={!selected || !range?.from}
                        onClick={() => {
                            if (range?.from && range?.to) {
                                generateMasterReportPdf(orders, range.from, range.to)
                            }
                        }}
                    >
                        <PrinterCheckIcon className="mr-2 h-4 w-4" />
                        Скачать отчет в pdf
                    </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <Card key={i} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-2xl font-bold">
                                {selected ? stat.value : '—'}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}