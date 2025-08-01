'use client'

import Link from "next/link"
import { Link2Icon } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { UserProps } from "@/types/user.types"
import { IncomeOutcomeProps } from "@/types/income-outcome.types"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"


// Преобразуем дату в формат сравнимый через sort
const parseDate = (date: string) => {
    const [d, m, y] = date.split(".").map(Number)
    return new Date(y, m - 1, d).getTime()
}



export const MasterAccounting = ({ data }: { data: UserProps }) => {
    const incomes = data.incomes;
    const outcomes = data.outcomes;

    const allRows: IncomeOutcomeProps[] = [
        ...incomes.map((item) => ({ ...item, type: "income" as const })),
        ...outcomes.map((item) => ({ ...item, type: "expense" as const })),
    ].sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt));

    const columns: ColumnDef<IncomeOutcomeProps>[] = [
        {
            accessorKey: "date",
            header: "Дата",
            cell: ({ row }) => row.original.createdAt,
        },
        {
            accessorKey: "type",
            header: "Тип",
            cell: ({ row }) => (
                <Badge variant={row.original.type === "income" ? "default" : "destructive"} className={row.original.type === "income" ? "bg-green-500" : "bg-red-500"}>
                    {row.original.type === "income" ? "Приход" : "Расход"}
                </Badge>
            ),
        },
        {
            accessorKey: "description",
            header: "Описание",
            cell: ({ row }) => row.original.note,
        },
        {
            accessorKey: "amount",
            header: "Сумма",
            cell: ({ row }) => (
                <Badge variant={row.original.type === "income" ? "default" : "destructive"} className={row.original.type === "income" ? "bg-green-500" : "bg-red-500"}>
                    {row.original.type === "expense" ? "-" : ""}{row.original.count.toLocaleString()} ₽
                </Badge>
            ),
        },
        {
            accessorKey: "orderId",
            header: "",
            cell: ({ row }) =>
                <Button variant={'secondary'} asChild>
                    <Link href={`/orders/${row.original.order.documentId}`}>
                        <Link2Icon />
                    </Link>
                </Button>
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center gap-4 mb-3">
                <h2 className="flex-auto">Движения по балансу мастера</h2>
            </div>
            <DataTable data={allRows} columns={columns} />
        </div>
    )
}