import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

import { AccountingIncome, AccountingExpense } from "@/types/accounting.types"
import { Badge } from "@/components/ui/badge"
import { demoMasters } from "@/demo-data"

export const accountingIncomeColumns: ColumnDef<AccountingIncome>[] = [
    {
        accessorKey: "date",
        header: "Дата",
        cell: ({ row }) => row.original.date,
    },
    {
        accessorKey: "description",
        header: "Описание",
        cell: ({ row }) => row.original.description,
    },
    {
        accessorKey: "orderId",
        header: "Заказ",
        cell: ({ row }) => row.original.orderId ? (
            <Link href={`/orders/${row.original.orderId}`}>{row.original.orderId}</Link>
        ) : "—",
    },
    {
        accessorKey: "masterId",
        header: "Мастер",
        cell: ({ row }) => {
            const master = demoMasters.find(m => m.id === row.original.masterId)
            return master ? master.name : "—"
        },
    },
    {
        accessorKey: "amount",
        header: "Сумма",
        cell: ({ row }) => (
            <Badge variant="default" className="bg-green-500">
                {row.original.amount.toLocaleString()} ₽
            </Badge>
        ),
    },
]

export const accountingExpenseColumns: ColumnDef<AccountingExpense>[] = [
    {
        accessorKey: "date",
        header: "Дата",
        cell: ({ row }) => row.original.date,
    },
    {
        accessorKey: "description",
        header: "Описание",
        cell: ({ row }) => row.original.description,
    },
    {
        accessorKey: "orderId",
        header: "Заказ",
        cell: ({ row }) => row.original.orderId ? (
            <Link href={`/orders/${row.original.orderId}`}>{row.original.orderId}</Link>
        ) : "—",
    },
    {
        accessorKey: "masterId",
        header: "Мастер",
        cell: ({ row }) => {
            const master = demoMasters.find(m => m.id === row.original.masterId)
            return master ? master.name : "—"
        },
    },
    {
        accessorKey: "amount",
        header: "Сумма",
        cell: ({ row }) => (
            <Badge variant="destructive" className="bg-red-500">
                -{row.original.amount.toLocaleString()} ₽
            </Badge>
        ),
    },
] 