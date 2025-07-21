'use client'

import { useState } from 'react'
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

const masters = [
    { id: 1, name: 'Иванов' },
    { id: 2, name: 'Петров' },
    { id: 3, name: 'Сидоров' },
]

const masterStats = {
    open: 3,
    completed: 18,
    rejected: 2,
    income: 14300,
}

type Props = {
    range: DateRange | undefined
}

export const MasterReport = ({ range }: Props) => {
    console.warn('range: ', range);
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<string | null>(null)

    const statCards = [
        { title: 'Открытые', value: masterStats.open },
        { title: 'Завершено', value: masterStats.completed },
        { title: 'Отказов', value: masterStats.rejected },
        { title: 'Доход', value: `${masterStats.income} ₽` },
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
                                    ? masters.find((m) => m.id.toString() === selected)?.name
                                    : 'Выберите мастера'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput placeholder="Поиск мастера..." />
                                <CommandEmpty>Не найдено</CommandEmpty>
                                <CommandGroup>
                                    {masters.map((m) => (
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

                    <Button>
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
                                {stat.value}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}