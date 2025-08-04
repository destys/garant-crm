"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { LinkIcon, PhoneIcon, TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ClientProps } from "@/types/client.types";

export const clientsColumns = (
    deleteClient: (documentId: string) => void
): ColumnDef<ClientProps>[] => [
        {
            accessorKey: "name",
            header: "ФИО",
            cell: ({ row }) => row.original.name,
        },
        {
            accessorKey: "phone",
            header: "Телефон",
            cell: ({ row }) => row.original.phone,
        },
        {
            id: "address",
            header: "Адрес",
            cell: ({ row }) => row.original.address || "—",
        },
        {
            accessorKey: "orders",
            header: "Кол-во заказов",
            cell: ({ row }) => (
                <div className="mx-auto flex justify-start items-center text-center">
                    <span className="flex justify-center items-center size-10 rounded-full bg-accent">
                        {row.original.orders?.length ?? 0}
                    </span>
                </div>
            ),
        },
        {
            id: "actions",
            header: () => <div className="text-right"></div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button size="icon" variant="outline" title="Открыть клиента" asChild>
                        <Link href={`/clients/${row.original.documentId}`}>
                            <LinkIcon className="size-4" />
                        </Link>
                    </Button>
                    <Button size="icon" title="Позвонить" asChild>
                        <Link href={`tel:${row.original.phone}`}>
                            <PhoneIcon className="size-4" />
                        </Link>
                    </Button>
                    <Button
                        size="icon"
                        variant="destructive"
                        title="Удалить"
                        onClick={() => deleteClient(row.original.documentId)}
                    >
                        <TrashIcon className="size-4" />
                    </Button>
                </div>
            ),
        },
    ];