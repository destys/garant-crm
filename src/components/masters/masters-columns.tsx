"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { EyeIcon, PhoneIcon, TrashIcon, UserCheck2Icon, UserX2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UpdateUserDto, UserProps } from "@/types/user.types";

// 🔹 Функция генерации колонок
export const mastersColumns = (
  updateUser: (data: { userId: number; updatedData: Partial<UpdateUserDto> }) => void,
  deleteUser: (id: number) => void
): ColumnDef<UserProps>[] => [
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
      cell: ({ row }) => (
        <div className="bg-accent rounded-full flex justify-center items-center aspect-square size-8">
          {row.original.orders.length}
        </div>
      ),
    },
    {
      accessorKey: "totalOrders",
      header: "Всего",
      cell: ({ row }) => (
        <div className="bg-accent rounded-full flex justify-center items-center aspect-square size-8">
          {row.original.orders.length}
        </div>
      ),
    },
    {
      accessorKey: "balance",
      header: "Баланс",
      cell: ({ row }) => (
        <Badge>
          {row.original.balance || 0} ₽
        </Badge>
      ),
    },
    {
      accessorKey: "blocked",
      header: "Статус",
      cell: ({ row }) => (
        <Badge variant={row.original.blocked ? "destructive" : "success"}>
          {row.original.blocked ? "Заблокирован" : "Активен"}
        </Badge>
      ),
    },
    {
      accessorKey: "role",
      header: "Роль",
      cell: ({ row }) => (
        <Badge variant={row.original.role.id == 3 ? "success" : row.original.role.id == 4 ? "default" : 'secondary'}>
          {row.original.role.id == 3 && "Админ"}
          {row.original.role.id == 4 && "Менеджер"}
          {row.original.role.id == 1 && "Мастер"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right"></div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="outline" title="Позвонить" asChild>
            <Link href={`tel:${row.original.phone}`}>
              <PhoneIcon className="size-4" />
            </Link>
          </Button>
          <Button size="icon" variant="outline" title="Посмотреть" asChild>
            <Link href={`/masters/${row.original.id}`}>
              <EyeIcon className="size-4" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant={!row.original.blocked ? "destructive" : "positive"}
            title="Заблокировать"
            onClick={() => {
              updateUser({
                userId: row.original.id,
                updatedData: { blocked: !row.original.blocked },
              })
              toast.success(!row.original.blocked ? "Аккаунт заблокирован" : "Аккаунт разблокирован")
            }

            }
          >
            {row.original.blocked ? (
              <UserCheck2Icon className="size-4" />
            ) : (
              <UserX2Icon className="size-4" />
            )}

          </Button>
          <Button
            size="icon"
            variant="destructive"
            title="Удалить"
            onClick={() => {
              deleteUser(row.original.id)
              toast.success("Аккаунт удален")
            }}
          >
            <TrashIcon className="size-4" />
          </Button>
        </div >
      ),
    },
  ];