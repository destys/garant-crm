'use client'

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type Transaction = {
    id: number
    type: "Начисление" | "Списание"
    amount: number
    date: string // format: "DD.MM.YYYY"
    reason: string
}

const mockData: Transaction[] = [
    { id: 1, type: "Начисление", amount: 8000, date: "16.07.2025", reason: "Заказ #123" },
    { id: 2, type: "Списание", amount: 1000, date: "17.07.2025", reason: "Штраф за опоздание" },
    { id: 3, type: "Начисление", amount: 6000, date: "18.07.2025", reason: "Заказ #124" },
    { id: 4, type: "Списание", amount: 500, date: "18.07.2025", reason: "Потерянный инструмент" },
]

// Преобразуем дату в формат сравнимый через sort
const parseDate = (date: string) => {
    const [d, m, y] = date.split(".").map(Number)
    return new Date(y, m - 1, d).getTime()
}

export const MasterAccounting = () => {
    const sortedData = [...mockData].sort((a, b) => parseDate(b.date) - parseDate(a.date))

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Движения по балансу мастера</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Дата</TableHead>
                            <TableHead>Тип</TableHead>
                            <TableHead>Причина</TableHead>
                            <TableHead className="text-right">Сумма</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.date}</TableCell>
                                <TableCell>
                                    <Badge variant={item.type === "Начисление" ? "success" : "destructive"}>
                                        {item.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>{item.reason}</TableCell>
                                <TableCell className="text-right">
                                    <Badge
                                        className={cn(
                                            "font-medium",
                                            item.type === "Начисление" && "bg-green-500",
                                            item.type === "Списание" && "bg-red-500"
                                        )}
                                    >
                                        {item.type === "Списание" && "-"}
                                        {item.amount.toLocaleString()} ₽
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}