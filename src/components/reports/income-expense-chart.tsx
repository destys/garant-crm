'use client'

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from 'recharts'
import { DateRange } from 'react-day-picker'
import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useIncomes } from '@/hooks/use-incomes'
import { useOutcomes } from '@/hooks/use-outcomes'

const COLORS = ['#4ade80', '#f87171', '#60a5fa', '#facc15', '#a78bfa']

type Props = {
    range: DateRange | undefined
}

export const IncomeExpenseChart = ({ range }: Props) => {
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
    const { outcomes = [] } = useOutcomes(1, 1000, filters)

    const groupedIncomes = useMemo(() => {
        const result: Record<string, number> = {}
        for (const income of incomes) {
            const category = income.income_category || 'Без категории'
            const amount = income.count || 0
            result[category] = (result[category] || 0) + amount
        }

        return Object.entries(result).map(([income_category, count]) => ({
            income_category,
            count,
        }))
    }, [incomes])

    const groupedOutcomes = useMemo(() => {
        const result: Record<string, number> = {}
        for (const outcome of outcomes) {
            const category = outcome.outcome_category || 'Без категории'
            const amount = outcome.count || 0
            result[category] = (result[category] || 0) + amount
        }

        return Object.entries(result).map(([outcome_category, count]) => ({
            outcome_category,
            count,
        }))
    }, [outcomes])

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Доходы</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={groupedIncomes}
                                dataKey="count"
                                nameKey="income_category"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {groupedIncomes.map((_, index) => (
                                    <Cell key={`income-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Расходы</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={groupedOutcomes}
                                dataKey="count"
                                nameKey="outcome_category"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {groupedOutcomes.map((_, index) => (
                                    <Cell key={`expense-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}