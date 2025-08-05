'use client'

import { addDays, endOfDay, startOfDay, startOfMonth, startOfQuarter, startOfYear } from 'date-fns'
import { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'

type Props = {
    setRange: (range: DateRange) => void
}

export const DateShortcuts = ({ setRange }: Props) => {
    const now = new Date()

    const shortcuts = [
        { label: 'Сегодня', range: { from: startOfDay(now), to: endOfDay(now) } },
        { label: 'Вчера', range: { from: startOfDay(addDays(now, -1)), to: endOfDay(addDays(now, -1)) } },
        { label: '3 дня', range: { from: startOfDay(addDays(now, -2)), to: endOfDay(now) } },
        { label: '7 дней', range: { from: startOfDay(addDays(now, -6)), to: endOfDay(now) } },
        { label: '30 дней', range: { from: startOfDay(addDays(now, -29)), to: endOfDay(now) } },
        { label: 'Этот месяц', range: { from: startOfMonth(now), to: endOfDay(now) } },
        { label: 'Квартал', range: { from: startOfQuarter(now), to: endOfDay(now) } },
        { label: 'Год', range: { from: startOfYear(now), to: endOfDay(now) } },
    ]

    return (
        <div className="flex flex-wrap gap-2">
            {shortcuts.map((s) => (
                <Button
                    key={s.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setRange(s.range)}
                >
                    {s.label}
                </Button>
            ))}
        </div>
    )
}