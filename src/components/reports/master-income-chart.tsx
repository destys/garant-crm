'use client'

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts'
import { DateRange } from 'react-day-picker'
import { useMemo } from 'react'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useIncomes } from '@/hooks/use-incomes'

type Props = {
    range: DateRange | undefined
}

export const MasterIncomeChart = ({ range }: Props) => {
    const filters = useMemo(() => {
        if (!range?.from || !range?.to) return undefined
        return {
            $and: [
                { createdAt: { $gte: range.from } },
                { createdAt: { $lte: range.to } },
            ],
        }
    }, [range])

    const { incomes = [] } = useIncomes(1, 1000, filters)

    // Группировка по мастерам
    const data = useMemo(() => {
        const grouped: Record<string, number> = {}

        for (const income of incomes) {
            const masterName = income.user?.name || 'Без мастера'
            const amount = income.count || 0

            if (!grouped[masterName]) {
                grouped[masterName] = 0
            }

            grouped[masterName] += amount
        }

        return Object.entries(grouped).map(([name, income]) => ({ name, income }))
    }, [incomes])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Доход по мастерам</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 16, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="income" fill="#4ade80" name="Доход" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}