"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { TrashIcon } from "lucide-react";

import { CashboxTransactionProps } from "@/types/cashbox.types";
import { TRANSACTION_STATUSES } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const cashboxColumns = (deleteTransaction: (documentId: string) => void): ColumnDef<CashboxTransactionProps>[] => [
    {
        accessorKey: "amount",
        header: "Сумма",
        cell: ({ row }) => <div className="font-bold">{row.original.amount} ₽</div>,
    },
    {
        accessorKey: "type",
        header: "Тип операции",
        cell: ({ row }) => <Badge variant={row.original.type === TRANSACTION_STATUSES[0] ? "success" : "destructive"}>{row.original.type}</Badge>,
    },
    {
        accessorKey: "createdAt",
        header: "Дата",
        cell: ({ row }) => format(row.original.createdAt, 'dd.MM.yyyy HH:mm:ss'),
    },
    {
        id: "user.name",
        header: "Юзер",
        cell: ({ row }) => row.original.user?.name,
    },
    {
        id: "note",
        header: "Комментарий",
        cell: ({ row }) => row.original.comment,
    },
    {
        id: "actions",
        header: () => <div className="text-right"></div>,
        cell: ({ row }) => (
            <div className="flex justify-end gap-2">
                <Button
                    size="icon"
                    variant="destructive"
                    title="Удалить"
                    onClick={() => deleteTransaction(row.original.documentId)}
                >
                    <TrashIcon className="size-4" />
                </Button>
            </div>
        ),
    },
];