'use client'

import React from 'react'
import { PlusIcon } from "lucide-react"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from "@/components/ui/table"
import { cn } from '@/lib/utils'

const mockIncomes = [
    { id: 1, amount: 12000, description: "Предоплата от клиента", date: "16.07.2025", master: "Иванов И.И." },
    { id: 2, amount: 8000, description: "Оплата после ремонта", date: "17.07.2025", master: "Петров С.С." }
]

const mockExpenses = [
    { id: 1, amount: 3000, description: "Закупка запчастей", date: "16.07.2025", master: "Иванов И.И." },
    { id: 2, amount: 1500, description: "Услуги курьера", date: "17.07.2025", master: "Смирнов А.А." }
]

export const OrderAccounting = () => {
    const renderTable = (
        data: typeof mockIncomes,
        type: "incomes" | "expenses"
    ) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Мастер</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.master}</TableCell>
                        <TableCell className="text-right">
                            <Badge
                                variant={type === "incomes" ? "default" : "destructive"}
                                className={cn(type === "incomes" && "bg-green-500")}
                            >
                                {item.amount.toLocaleString()} ₽
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )

    return (
        <div className="grid gap-6 mt-6 md:grid-cols-2">
            {/* Приходы */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Приходы</CardTitle>
                    <Button size="sm" variant="default">
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Добавить приход
                    </Button>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    {renderTable(mockIncomes, "incomes")}
                </CardContent>
            </Card>

            {/* Расходы */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Расходы</CardTitle>
                    <Button size="sm" variant="outline">
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Добавить расход
                    </Button>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    {renderTable(mockExpenses, "expenses")}
                </CardContent>
            </Card>
        </div>
    )
}