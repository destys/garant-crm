/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { Link2Icon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { UserProps } from "@/types/user.types";
import { IncomeOutcomeProps } from "@/types/income-outcome.types";
import { ManualIncomeOutcomeProps } from "@/types/manual-io.types";

// универсальный timestamp из ISO или dd.MM.yyyy
const toTs = (dateStr?: string | null) => {
    if (!dateStr) return 0;
    if (dateStr.includes("-") || dateStr.includes("T")) {
        const t = new Date(dateStr).getTime();
        return Number.isFinite(t) ? t : 0;
    }
    const parts = dateStr.split(".").map(Number);
    if (parts.length >= 3) {
        const [d, m, y] = parts;
        const t = new Date(y, (m || 1) - 1, d || 1).getTime();
        return Number.isFinite(t) ? t : 0;
    }
    return 0;
};

// строка таблицы после нормализации из разных источников
type Row = {
    id: number | string;
    createdAt: string;
    note: string;
    amountAbs: number;               // всегда модуль
    type: "income" | "expense";
    orderDocumentId?: string;
};

const normalizeIncome = (i: IncomeOutcomeProps): Row => ({
    id: i.id,
    createdAt: i.createdAt,
    note: i.note ?? "",
    amountAbs: Math.abs(Number(i.count ?? 0)),
    type: "income",
    orderDocumentId: i.order?.documentId || undefined,
});

const normalizeOutcome = (o: IncomeOutcomeProps): Row => ({
    id: o.id,
    createdAt: o.createdAt,
    note: o.note ?? "",
    amountAbs: Math.abs(Number(o.count ?? 0)),
    type: "expense",
    orderDocumentId: o.order?.documentId || undefined,
});

const normalizeManual = (m: ManualIncomeOutcomeProps): Row => {
    const raw = Number(m.count ?? 0);
    const typeLower = (m.type || "").toLowerCase();
    const isIncome =
        typeLower === "income" ||
        typeLower === "приход" ||
        (typeLower !== "expense" && raw > 0);

    return {
        id: m.id,
        createdAt: m.createdAt,                // системное поле Strapi
        note: m.note ?? "",
        amountAbs: Math.abs(raw),
        type: isIncome ? "income" : "expense",
        // у ручных нет привязки к заказу
    };
};

export const MasterAccounting = ({ data }: { data: UserProps }) => {
    const incomes: IncomeOutcomeProps[] = (data as any).incomes ?? [];
    const outcomes: IncomeOutcomeProps[] = (data as any).outcomes ?? [];
    const manual: ManualIncomeOutcomeProps[] =
        (data as any).manual_income_outcomes ?? [];

    // сводим к одному формату
    const rows: Row[] = [
        ...incomes.map(normalizeIncome),
        ...outcomes.map(normalizeOutcome),
        ...manual.map(normalizeManual),
    ].sort((a, b) => toTs(b.createdAt) - toTs(a.createdAt));

    const columns: ColumnDef<Row>[] = [
        {
            accessorKey: "createdAt",
            header: "Дата",
            cell: ({ row }) => row.original.createdAt,
        },
        {
            accessorKey: "type",
            header: "Тип",
            cell: ({ row }) => (
                <Badge
                    variant={row.original.type === "income" ? "default" : "destructive"}
                    className={row.original.type === "income" ? "bg-green-500" : "bg-red-500"}
                >
                    {row.original.type === "income" ? "Приход" : "Расход"}
                </Badge>
            ),
        },
        {
            accessorKey: "note",
            header: "Описание",
            cell: ({ row }) => row.original.note || "",
        },
        {
            accessorKey: "amountAbs",
            header: "Сумма",
            cell: ({ row }) => (
                <Badge
                    variant={row.original.type === "income" ? "default" : "destructive"}
                    className={row.original.type === "income" ? "bg-green-500" : "bg-red-500"}
                >
                    {row.original.type === "expense" ? "-" : ""}
                    {row.original.amountAbs.toLocaleString()} ₽
                </Badge>
            ),
        },
        {
            id: "orderLink",
            header: "",
            cell: ({ row }) =>
                row.original.orderDocumentId ? (
                    <Button variant="secondary" asChild>
                        <Link href={`/orders/${row.original.orderDocumentId}`}>
                            <Link2Icon />
                        </Link>
                    </Button>
                ) : null,
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center gap-4 mb-3">
                <h2 className="flex-auto">Движения по балансу мастера</h2>
            </div>
            <DataTable data={rows} columns={columns} />
        </div>
    );
};