/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import {
  ColumnDef,
} from "@tanstack/react-table"
import { format, differenceInDays } from "date-fns"
import { EyeIcon, PhoneIcon, TrashIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { OrderProps } from "@/types/order.types"
import { UserProps } from "@/types/user.types"

const statusColorMap: Record<string, string> = {
  "Новая": "bg-blue-300 hover:bg-blue-400",
  "Согласовать": "bg-orange-100 hover:bg-orange-200",
  "Отремонтировать": "bg-red-100 hover:bg-red-200",
  "Купить запчасти": "bg-yellow-100 hover:bg-yellow-200",
  "Готово": "bg-green-100 hover:bg-green-200",
  "Отправить курьера": "bg-lime-100 hover:bg-lime-200",
  "Отправить инженера": "bg-green-100 hover:bg-green-200",
  "Продать": "bg-purple-100 hover:bg-purple-200",
  "Юридический отдел": "bg-blue-100 hover:bg-blue-200",
  "Отказ": "bg-red-200 hover:bg-red-300",
  "Выдан": "bg-gray-100 hover:bg-gray-200",
  "Проверить": "bg-orange-100 hover:bg-orange-200",
}

const linkWrapper = (row: any, content: React.ReactNode) => (
  <Link href={`/orders/${row.original.documentId}`} className="block w-full h-full">
    {content}
  </Link>
)

export const ordersColumns = (
  users: UserProps[],
  updateOrder: (data: { documentId: string; updatedData: any }) => void,
  deleteOrder: (documentId: string) => void,
  refetch?: () => void,
  roleId?: number,
  user?: UserProps): ColumnDef<OrderProps>[] => [
    {
      accessorKey: "order_number",
      header: "№ Заказа",
      cell: ({ row }) =>
        <div className="uppercase">{linkWrapper(row, row.original.title)}</div>,
    },
    {
      accessorKey: "orderStatus",
      header: "Статус",
      cell: ({ row }) => {
        const status = row.original.orderStatus
        const colorClasses = statusColorMap[status] ?? "bg-white"

        return linkWrapper(
          row,
          <Badge variant="outline" className={cn("text-muted-foreground", colorClasses)}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "visit_date",
      header: "Дата выезда",
      cell: ({ row }) => row.original.visit_date ? linkWrapper(row, format(new Date(row.original.visit_date), "dd.MM.yyyy HH:mm")) : "-"
    },
    {
      accessorKey: "deadline",
      header: "Дедлайн",
      cell: ({ row }) => {
        if (!row.original.deadline) return "Не назначен"
        const deadline = new Date(row.original.deadline)
        const today = new Date()
        const diff = differenceInDays(deadline, today)

        let color = "default"
        let text = format(deadline, "dd.MM.yyyy")

        if (diff < 0) {
          color = "destructive"
          text = `Просрочено на ${Math.abs(diff)} дн.`
        } else if (diff <= 2) {
          color = "warning"
          text = `Остался ${diff} дн.`
        }

        return linkWrapper(
          row,
          <Badge
            variant={color === "destructive" ? "destructive" : "outline"}
            className={color === "warning" ? "bg-yellow-200 text-yellow-900" : ""}
          >
            {text}
          </Badge>
        )
      },
    },
    {
      accessorKey: "device",
      header: "Устройство",
      cell: ({ row }) =>
        linkWrapper(row, <div className="space-y-2 text-xs text-center">
          <div>{row.original.device_type || "-"}</div>
          <div>{row.original.brand || "-"} / {row.original.model || "-"}</div>
        </div >),
    },
    {
      accessorKey: "client.phone",
      header: "Телефон",
      cell: ({ row }) =>
        linkWrapper(row, `${row.original.client?.phone}`),
    },
    {
      id: "cost",
      header: "Цена",
      cell: ({ row }) =>
        linkWrapper(row, <div className="space-y-2">
          <div className="flex items-center justify-between gap-1">Стоимость: <Badge variant={+row.original.total_cost > 0 ? "success" : "default"}>{row.original.total_cost || 0} ₽</Badge></div>
          <div className="flex items-center justify-between gap-1">Предоплата: <Badge variant={+row.original.prepay > 0 ? "success" : "default"}>{row.original.prepay || 0} ₽</Badge></div>
        </div>),
    },
    {
      id: "masters",
      header: "Сотрудник",
      cell: ({ row }) => (
        roleId === 1 ?
          (
            <div>{user?.name || "Не заполнено имя"}</div>
          ) : (
            <Select
              defaultValue={row.original.master?.id?.toString()}
              onValueChange={(value) => {
                updateOrder({
                  documentId: row.original.documentId,
                  updatedData: { master: { id: +value } },
                });

                toast.success("Сотрудник назначен")
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Выбрать" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select >
          )
      ),
    },
    {
      accessorKey: "author",
      header: "Автор заявки",
      cell: ({ row }) =>
        linkWrapper(row, <div className="flex justify-center"><Badge variant={row.original.author ? "success" : "default"}>{row.original.author || "API"}</Badge></div>),
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <Button size="icon" variant="outline" title="Посмотреть" asChild>
            <Link href={`/orders/${row.original.documentId}`}>
              <EyeIcon className="size-4" />
            </Link>
          </Button>
          <Button size="icon" variant="outline" title="Позвонить" asChild>
            <Link href={`tel:${row.original.client?.phone}`}>
              <PhoneIcon className="size-4" />
            </Link>
          </Button>
          {roleId === 3 && (
            <Button size="icon" variant="destructive" title="Удалить" onClick={
              () => {
                deleteOrder(row.original.documentId)
                if (refetch) {
                  refetch();
                }
                toast.success("Заказ удален")
              }
            }>
              <TrashIcon className="size-4" />
            </Button>
          )}

        </div>
      ),
    },
  ]