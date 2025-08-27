'use client'

import React from 'react'
import { PlusIcon } from "lucide-react"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableHeader,
    TableRow,
    TableCell,
    TableBody,
    TableHead,
} from "@/components/ui/table"
import { cn, formatDate } from '@/lib/utils'
import { OrderProps } from '@/types/order.types'
import { IncomeOutcomeProps } from '@/types/income-outcome.types'
import { useModal } from '@/providers/modal-provider'
import { useAuth } from '@/providers/auth-provider'

interface Props {
    data: OrderProps;
}

export const OrderAccounting = ({ data }: Props) => {
    const { openModal } = useModal();
    const { roleId } = useAuth();

    const renderTable = (
        data: IncomeOutcomeProps[],
        type: "incomes" | "expenses"
    ) => (
        <div className="w-full overflow-x-auto">
            <Table className="min-w-[600px]">
                <TableHeader>
                    <TableRow>
                        <TableHead className="whitespace-nowrap">Дата</TableHead>
                        <TableHead className="whitespace-nowrap">Описание</TableHead>
                        <TableHead className="whitespace-nowrap">Сотрудник</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Сумма</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>

                    {data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{formatDate(item.createdAt, 'PPP')}</TableCell>
                            <TableCell>{item.note}</TableCell>
                            <TableCell>{item.user?.name || ""}</TableCell>
                            <TableCell className="text-right">
                                <Badge
                                    variant={type === "incomes" ? "default" : "destructive"}
                                    className={cn(type === "incomes" && "bg-green-500")}
                                >
                                    {item.count.toLocaleString()} ₽
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )

    return (
        <div className="grid gap-6 mt-6 grid-cols-1 sm:grid-cols-2">
            {/* Приходы */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-lg">Приходы</CardTitle>
                    <Button size="sm" variant="default" className="w-full sm:w-auto"
                        onClick={() =>
                            openModal("incomeOutcome", { title: "Добавить приход", props: { type: "income", orderId: data.documentId, masterId: roleId === 1 ? data.master.id : null } })
                        }
                    >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        <span>Добавить приход</span>
                    </Button>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">{renderTable(data.incomes, "incomes")}</CardContent>
            </Card>

            {/* Расходы */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-lg">Расходы</CardTitle>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto"
                        onClick={() =>
                            openModal("incomeOutcome", { title: "Добавить расход", props: { type: "outcome", orderId: data.documentId, masterId: roleId === 1 ? data.master.id : null } })
                        }
                    >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        <span>Добавить расход</span>
                    </Button>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">{renderTable(data.outcomes, "expenses")}</CardContent>
            </Card>
        </div>
    )
}