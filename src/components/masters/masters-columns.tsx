"use client"

import * as React from "react"
import {
  ColumnDef,
} from "@tanstack/react-table"
import {
  IconEye,
  IconPhone,
  IconTrash,
  IconUserX,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

type Master = {
  id: number
  name: string
  phone: string
  activeOrders: number
  totalOrders: number
  eta: string
}

// 🔹 Табличные колонки
export const mastersColumns: ColumnDef<Master>[] = [
  {
    accessorKey: "name",
    header: "ФИО мастера",
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "phone",
    header: "Телефон",
    cell: ({ row }) => row.original.phone,
  },
  {
    accessorKey: "activeOrders",
    header: "В работе",
    cell: ({ row }) => row.original.activeOrders,
  },
  {
    accessorKey: "totalOrders",
    header: "Всего",
    cell: ({ row }) => row.original.totalOrders,
  },
  {
    id: "actions",
    header: () => <div className="text-right"></div>,
    cell: () => {
      return (
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="outline" title="Позвонить">
            <IconPhone className="size-4" />
          </Button>
          <Button size="icon" variant="outline" title="Посмотреть">
            <IconEye className="size-4" />
          </Button>
          <Button size="icon" variant="destructive" title="Заблокировать">
            <IconUserX className="size-4" />
          </Button>
          <Button size="icon" variant="destructive" title="Удалить">
            <IconTrash className="size-4" />
          </Button>
        </div>
      )
    },
  }
]