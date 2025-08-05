'use client'

import { useMemo } from "react"
import { DateRange } from "react-day-picker"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrders } from "@/hooks/use-orders"
import { useClients } from "@/hooks/use-clients"

type Props = {
    range: DateRange | undefined
}

export const StatsTiles = ({ range }: Props) => {
    const filters = useMemo(() => {
        if (!range?.from || !range?.to) return undefined
        return {
            $and: [
                { createdAt: { $gte: range.from } },
                { createdAt: { $lte: range.to } },
            ],
        }
    }, [range])

    const { data: orders = [], isLoading: ordersLoading } = useOrders(1, 500, filters)
    const { clients = [], isLoading: clientsLoading } = useClients(1, 500, filters)

    const stats = useMemo(() => {
        const totalOrders = orders.length

        const completedOrders = orders.filter(
            (o) => o.orderStatus === "Выдан" && o.is_approve === true
        ).length

        const refusedOrders = orders.filter(
            (o) => o.orderStatus === "Отказ" && o.is_approve === true
        ).length

        const refusalRate =
            totalOrders > 0
                ? Math.round((refusedOrders / totalOrders) * 100) + "%"
                : "0%"

        return [
            { title: "Всего заказов", value: totalOrders },
            { title: "Новых клиентов", value: clients.length },
            { title: "Завершенных заказов", value: completedOrders },
            { title: "Отказы (%)", value: refusalRate },
        ]
    }, [orders, clients])

    const isLoading = ordersLoading || clientsLoading

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat, i) => (
                <Card key={i} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">
                        {isLoading ? "…" : stat.value}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}