'use client'

import { DateRange } from "react-day-picker"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
    range: DateRange | undefined
}

const demoStats = [
    {
        title: "Всего заказов",
        value: 120,
    },
    {
        title: "Новых клиентов",
        value: 45,
    },
    {
        title: "Завершенных заказов",
        value: 90,
    },
    {
        title: "Отказы (%)",
        value: "25%",
    },
]

export const StatsTiles = ({ range }: Props) => {
    console.warn('range: ', range);
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {demoStats.map((stat, i) => (
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
    )
}