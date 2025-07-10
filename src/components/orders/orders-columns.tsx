"use client"

import * as React from "react"
import {
  ColumnDef,
} from "@tanstack/react-table"
import { format, differenceInDays } from "date-fns"
import { EyeIcon, PhoneIcon, TrashIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { demoMasters } from "@/demo-data"
import { cn } from "@/lib/utils"

type Order = {
  order_number: string;
  order_status: string;
  departure_date: string;
  deadline: string;
  device: {
    type: string
    brand: string
    model: string
  };
  payment: {
    prepay: string;
    total: string;
  };
  masters: {
    id: number;
    name: string;
  }[];
}

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

export const ordersColumns: ColumnDef<Order>[] = [
  {
    accessorKey: "order_number",
    header: "№ Заказа",
    cell: ({ row }) => row.original.order_number,
  },
  {
    accessorKey: "order_status",
    header: "Статус",
    cell: ({ row }) => {
      const status = row.original.order_status
      const colorClasses = statusColorMap[status] ?? "bg-white"

      return (
        <Badge variant="outline" className={cn("text-muted-foreground", colorClasses)}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "departure_date",
    header: "Дата выезда",
    cell: ({ row }) => format(new Date(row.original.departure_date), "dd.MM.yyyy"),
  },
  {
    accessorKey: "deadline",
    header: "Дедлайн",
    cell: ({ row }) => {
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

      return (
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
    cell: ({ row }) => {
      const d = row.original.device
      return `${d.type} / ${d.brand} / ${d.model}`
    },
  },
  {
    accessorKey: "payment",
    header: "Оплата",
    cell: ({ row }) => {
      const { prepay, total } = row.original.payment
      return `₽${prepay} / ₽${total}`
    },
  },
  {
    id: "masters",
    header: "Мастер",
    cell: () => (
      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Выбрать" />
        </SelectTrigger>
        <SelectContent>
          {demoMasters.map((master) => (
            <SelectItem key={master.id} value={master.name}>
              {master.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: () => (
      <div className="flex gap-2 justify-end">
        <Button size="icon" variant="outline" title="Посмотреть">
          <EyeIcon className="size-4" />
        </Button>
        <Button size="icon" variant="outline" title="Посмотреть">
          <PhoneIcon className="size-4" />
        </Button>
        <Button size="icon" variant="destructive" title="Удалить">
          <TrashIcon className="size-4" />
        </Button>
      </div>
    ),
  },
]