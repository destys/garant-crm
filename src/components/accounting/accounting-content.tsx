"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Link2Icon } from "lucide-react";

import { demoAccountingIncomes, demoAccountingExpenses } from "@/demo-data";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoMasters } from "@/demo-data";

// Объединённый тип для строки таблицы
interface AccountingRow {
    id: number;
    date: string;
    amount: number;
    description: string;
    orderId?: string;
    masterId?: number;
    type: "income" | "expense";
}

function parseDate(date: string) {
    if (date.includes(".")) {
        const [d, m, y] = date.split(".").map(Number);
        return new Date(y, m - 1, d).getTime();
    }
    return new Date(date).getTime();
}

const allRows: AccountingRow[] = [
    ...demoAccountingIncomes.map((item) => ({ ...item, type: "income" as const })),
    ...demoAccountingExpenses.map((item) => ({ ...item, type: "expense" as const })),
].sort((a, b) => parseDate(b.date) - parseDate(a.date));

const columns: ColumnDef<AccountingRow>[] = [
    {
        accessorKey: "date",
        header: "Дата",
        cell: ({ row }) => row.original.date,
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
        cell: ({ row }) => row.original.description,
    },

    {
        accessorKey: "masterId",
        header: "Мастер",
        cell: ({ row }) => {
            const master = demoMasters.find(m => m.id === row.original.masterId);
            return master ? master.name : "—";
        },
    },
    {
        accessorKey: "amount",
        header: "Сумма",
        cell: ({ row }) => (
            <Badge variant={row.original.type === "income" ? "default" : "destructive"} className={row.original.type === "income" ? "bg-green-500" : "bg-red-500"}>
                {row.original.type === "expense" ? "-" : ""}{row.original.amount.toLocaleString()} ₽
            </Badge>
        ),
    },
    {
        accessorKey: "orderId",
        header: "",
        cell: () =>
            <Button variant={'secondary'} asChild>
                <Link href={`/orders/asdasdasdad`}>
                    <Link2Icon />
                </Link>
            </Button>
    },
];

export const AccountingContent = () => {
    return (
        <div>
            <div className="flex justify-between items-center gap-4 mb-8">
                <h1 className="flex-auto">Бухгалтерия: Движения по счету</h1>
            </div>
            <DataTable data={allRows} columns={columns} />
        </div>
    )
} 