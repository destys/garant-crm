/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatName } from "@/lib/utils";
import { OrderProps } from "@/types/order.types";
import { UserProps } from "@/types/user.types";

import { ActionsCell } from "./order-action-cell";

const statusColorMap: Record<string, string> = {
  Новая: "bg-blue-300 hover:bg-blue-400",
  Согласовать: "bg-orange-100 hover:bg-orange-200",
  Отремонтировать: "bg-red-100 hover:bg-red-200",
  "Купить запчасти": "bg-yellow-100 hover:bg-yellow-200",
  Готово: "bg-green-100 hover:bg-green-200",
  "Отправить курьера": "bg-lime-100 hover:bg-lime-200",
  "Отправить инженера": "bg-green-100 hover:bg-green-200",
  Продать: "bg-purple-100 hover:bg-purple-200",
  "Юридический отдел": "bg-blue-100 hover:bg-blue-200",
  Отказ: "bg-red-200 hover:bg-red-300",
  Выдан: "bg-gray-100 hover:bg-gray-200",
  Проверить: "bg-orange-100 hover:bg-orange-200",
};

const linkWrapper = (row: any, content: React.ReactNode) => (
  <Link
    href={`/orders/${row.original.documentId}`}
    className="block w-full h-full"
  >
    {content}
  </Link>
);

export const ordersColumns = (
  users: UserProps[],
  updateOrder: (data: { documentId: string; updatedData: any }) => void,
  deleteOrder: (documentId: string) => void,
  refetch?: () => void,
  roleId?: number,
  user?: UserProps
): ColumnDef<OrderProps>[] => [
  {
    accessorKey: "order_number",
    header: "№ Заказа",
    cell: ({ row }) => {
      const status = row.original.orderStatus;
      const colorClasses = statusColorMap[status] ?? "bg-white";

      return (
        <div className="flex flex-col items-center gap-1 text-center">
          {/* номер заказа */}
          {linkWrapper(
            row,
            <span className="uppercase">{row.original.title}</span>
          )}

          {/* статус под номером */}
          {linkWrapper(
            row,
            <Badge
              variant="outline"
              className={cn("text-muted-foreground", colorClasses, "w-fit")}
            >
              {status}
            </Badge>
          )}

          {/* дата создания */}
          <div className="text-[8px] text-muted-foreground">
            {format(row.original.createdAt, "dd.MM.yy HH:mm")}
          </div>
        </div>
      );
    },
  },
  {
    id: "visit_deadline",
    header: "Визит / Дедлайн",
    cell: ({ row }) => {
      // Визит
      const visitText = row.original.visit_date
        ? format(new Date(row.original.visit_date), "dd.MM в HH:mm")
        : "—";

      // Дедлайн
      let deadlineNode: React.ReactNode = (
        <span className="text-xs">Не назначен</span>
      );
      if (row.original.deadline) {
        const deadline = new Date(row.original.deadline);
        const today = new Date();
        const diff = differenceInDays(deadline, today);

        let variant: "destructive" | "outline" = "outline";
        let extraClass = "";
        let text = format(deadline, "dd.MM.yyyy");

        if (diff < 0) {
          variant = "destructive";
          text = `⚠️ на ${Math.abs(diff)} дн.`;
        } else if (diff <= 2) {
          extraClass = "bg-yellow-200 text-yellow-900";
          text = `Осталось ${diff} дн.`;
        }

        deadlineNode = (
          <Badge variant={variant} className={extraClass}>
            {text}
          </Badge>
        );
      }

      return linkWrapper(
        row,
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Выезд:</span>
            <span className="font-medium">{visitText}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Дедлайн:</span>
            {deadlineNode}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "device",
    header: "Устройство",
    cell: ({ row }) =>
      linkWrapper(
        row,
        <div className="space-y-2 text-[10px] text-center">
          <div>{row.original.device_type || "-"}</div>
          <div>
            {row.original.brand || "-"} / {row.original.model || "-"}
          </div>
        </div>
      ),
  },
  {
    accessorKey: "client.phone",
    header: "Телефон",
    cell: ({ row }) => (
      <div className="text-xs">
        {linkWrapper(row, `${row.original.client?.phone}`)}
      </div>
    ),
  },
  {
    id: "cost",
    header: "Цена",
    cell: ({ row }) =>
      linkWrapper(
        row,
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-1">
            Ст-сть:{" "}
            <Badge
              variant={+row.original.total_cost > 0 ? "success" : "default"}
            >
              {row.original.total_cost || 0} ₽
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-1">
            Пред-та:{" "}
            <Badge variant={+row.original.prepay > 0 ? "success" : "default"}>
              {row.original.prepay || 0} ₽
            </Badge>
          </div>
        </div>
      ),
  },
  {
    id: "masters",
    header: "Сотрудник",
    cell: ({ row }) =>
      roleId === 1 ? (
        <div>{user?.name || "Не заполнено имя"}</div>
      ) : (
        <Select
          defaultValue={row.original.master?.id?.toString()}
          onValueChange={(value) => {
            updateOrder({
              documentId: row.original.documentId,
              updatedData: { master: { id: +value } },
            });

            toast.success("Сотрудник назначен");
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Выбрать" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {formatName(user.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
  },
  {
    accessorKey: "author",
    header: "Создал",
    cell: ({ row }) =>
      linkWrapper(
        row,
        <div className="flex justify-center">
          <Badge variant={row.original.author ? "success" : "default"}>
            {formatName(row.original.author) || "API"}
          </Badge>
        </div>
      ),
  },
  {
    accessorKey: "actions",
    header: "",
    cell: (ctx) => (
      <ActionsCell
        row={ctx.row}
        roleId={roleId}
        updateOrder={updateOrder}
        deleteOrder={deleteOrder}
        refetch={refetch}
      />
    ),
  },
];
