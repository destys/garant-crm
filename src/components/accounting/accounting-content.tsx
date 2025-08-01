"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Link2Icon, PlusIcon } from "lucide-react";
import { useMemo } from "react";

import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIncomes } from "@/hooks/use-incomes";
import { useOutcomes } from "@/hooks/use-outcomes";
import { IncomeOutcomeProps } from "@/types/income-outcome.types";
import { useUsers } from "@/hooks/use-users";
import { cn, formatDate } from "@/lib/utils";
import { useModal } from '@/providers/modal-provider'

export const AccountingContent = () => {
    const { incomes } = useIncomes(1, 500)
    const { outcomes } = useOutcomes(1, 500)
    const { users } = useUsers(1, 100);
    const { openModal } = useModal();

    const columns: ColumnDef<IncomeOutcomeProps>[] = [
        {
            accessorKey: "date",
            header: "Дата",
            cell: ({ row }) => formatDate(row.original.createdAt, 'PPP HH:mm'),
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
            accessorKey: "masterId",
            header: "Мастер",
            cell: ({ row }) => {
                const master = users.find(m => m.id === row.original.user?.id);
                return master ? master.name : "—";
            },
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
                <Button variant={'secondary'} disabled={!!!row.original.order} asChild>
                    <Link href={`/orders/${row.original.order?.documentId}`} className={cn(!!!row.original.order && "pointer-events-none opacity-50")}>
                        <Link2Icon />
                    </Link>
                </Button>
        },
    ];

    const allRows = useMemo(() => {
        return [
            ...incomes.map((i) => ({ ...i, type: "income" as const })),
            ...outcomes.map((o) => ({ ...o, type: "expense" as const })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [incomes, outcomes]);

    return (
        <div>
            <div className="flex justify-between items-center gap-4 mb-8">
                <h1 className="flex-auto">Бухгалтерия: Движения по счету</h1>
            </div>
            <div className="flex gap-4">
                <Button size="sm" variant="default" className="w-full sm:w-auto"
                    onClick={() =>
                        openModal("incomeOutcome", { title: "Добавить приход", props: { type: "income" } })
                    }
                >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    <span>Добавить приход</span>
                </Button>
                <Button size="sm" variant="destructive" className="w-full sm:w-auto"
                    onClick={() =>
                        openModal("incomeOutcome", { title: "Добавить расход", props: { type: "outcome" } })
                    }
                >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    <span>Добавить расход</span>
                </Button>
            </div>
            <DataTable data={allRows} columns={columns} />
        </div>
    )
} 