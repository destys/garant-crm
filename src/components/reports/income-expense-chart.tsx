'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { DateRange } from 'react-day-picker'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#4ade80', '#f87171', '#60a5fa', '#facc15', '#a78bfa']

const incomeData = [
    { name: 'Ремонт', value: 32000 },
    { name: 'Диагностика', value: 8000 },
    { name: 'Доставка', value: 4000 },
]

const expenseData = [
    { name: 'Зарплаты', value: 15000 },
    { name: 'Запчасти', value: 12000 },
    { name: 'Реклама', value: 3000 },
]

type Props = {
    range: DateRange | undefined
}

export const IncomeExpenseChart = ({ range }: Props) => {
    console.warn('range: ', range);
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
                                data={incomeData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {incomeData.map((_, index) => (
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
                                data={expenseData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {expenseData.map((_, index) => (
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