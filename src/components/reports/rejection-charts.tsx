'use client'

import { useMemo } from 'react'
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from 'recharts'
import { DateRange } from 'react-day-picker'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrders } from '@/hooks/use-orders'

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#00C49F', '#8884D8']

type Props = {
    range: DateRange | undefined
}

export const RejectionCharts = ({ range }: Props) => {
    const filters = useMemo(() => {
        if (!range?.from || !range?.to) return undefined
        return {
            $and: [
                { createdAt: { $gte: range.from } },
                { createdAt: { $lte: range.to } },
            ],
        }
    }, [range])

    const { data: orders = [] } = useOrders(1, 500, filters)

    // Причины отказов — только заказы со статусом "Отказ"
    const refusalData = useMemo(() => {
        const grouped: Record<string, number> = {}

        orders
            .filter(o => o.orderStatus === "Отказ")
            .forEach(order => {
                const reason = order.reason_for_refusal || 'Без причины'
                grouped[reason] = (grouped[reason] || 0) + 1
            })

        return Object.entries(grouped).map(([name, value]) => ({ name, value }))
    }, [orders])

    // Источники обращений — все заказы
    const sourceData = useMemo(() => {
        const grouped: Record<string, number> = {}

        orders.forEach(order => {
            const source = order.source || 'Без источника'
            grouped[source] = (grouped[source] || 0) + 1
        })

        return Object.entries(grouped).map(([name, value]) => ({ name, value }))
    }, [orders])

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Причины отказов</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={refusalData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {refusalData.map((_, index) => (
                                    <Cell key={`refusal-${index}`} fill={COLORS[index % COLORS.length]} />
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
                    <CardTitle>Источники обращений</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={sourceData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {sourceData.map((_, index) => (
                                    <Cell key={`source-${index}`} fill={COLORS[index % COLORS.length]} />
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