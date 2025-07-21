'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { DateRange } from 'react-day-picker'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#00C49F', '#8884D8']

const rejectionData = [
    { name: 'Дорого', value: 12 },
    { name: 'Долго ждать', value: 5 },
    { name: 'Нет запчастей', value: 3 },
    { name: 'Передумал', value: 2 },
]

const sourceData = [
    { name: 'Сайт', value: 45 },
    { name: 'Реклама', value: 25 },
    { name: 'Звонок', value: 20 },
    { name: 'Рекомендации', value: 10 },
]

type Props = {
    range: DateRange | undefined
}

export const RejectionCharts = ({ range }: Props) => {
    console.warn('range: ', range);
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
                                data={rejectionData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {rejectionData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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