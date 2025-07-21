"use client"

import * as React from "react"
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table"
import { LinkIcon, PhoneIcon, TrashIcon } from "lucide-react"
import Link from "next/link"

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

type Client = {
  id: number
  name: string
  phone: string
  orders: number
  revenue: number
}

// 🔹 Табличные колонки
const columns: ColumnDef<Client>[] = [
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
    id: "address",
    header: "Адрес",
    cell: () => "Ул. Пушкина, дом Колотушкина",
  },
  {
    accessorKey: "orders",
    header: "Кол-во заказов",
    cell: ({ row }) => <div className="mx-auto flex justify-start items-center text-center"><span className="flex justify-center items-center size-10 rounded-full bg-accent">{row.original.orders}</span></div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right"></div>,
    cell: () => {
      return (
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="outline" title="Позвонить" asChild>
            <Link href={'/clients/sh28sjadaj21'}>
              <LinkIcon className="size-4" />
            </Link>
          </Button>
          <Button size="icon" title="Позвонить">
            <PhoneIcon className="size-4" />
          </Button>
          <Button size="icon" variant="destructive" title="Удалить">
            <TrashIcon className="size-4" />
          </Button>
        </div>
      )
    },
  }
]

export function ClientsTable({ data }: { data: Client[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader className="bg-muted">
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} className={cell.column.id === "actions" ? "text-right" : ""}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-6 text-muted-foreground" >
                Нет данных
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}