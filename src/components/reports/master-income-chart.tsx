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

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const demoData = [
    { name: 'Иванов', income: 12000 },
    { name: 'Петров', income: 18000 },
    { name: 'Сидоров', income: 9500 },
    { name: 'Алексеев', income: 14300 },
    { name: 'Николаев', income: 10800 }
]

type Props = {
    range: DateRange | undefined
}

export const MasterIncomeChart = ({ range }: Props) => {
    console.warn('range: ', range);
    return (
        <Card>
            <CardHeader>
                <CardTitle>Доход по мастерам</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={demoData} margin={{ top: 16, right: 20, left: 0, bottom: 5 }}>
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