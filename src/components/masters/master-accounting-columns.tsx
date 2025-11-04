/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  CheckCheckIcon,
  CheckIcon,
  Link2Icon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IncomeOutcomeProps } from "@/types/income-outcome.types";
import { cn, formatDate, formatName } from "@/lib/utils";

interface BuildColumnsProps {
  roleId: number | null;
  users: any[];
  updateUser: (args: any) => void;
  updateIncome: any;
  updateOutcome: any;
  deleteIncome: any;
  deleteOutcome: any;
  deleteManualIO: any; // ✅ добавили
  openModal: (a: string, b: any) => void;
}

export const buildMasterAccountingColumns = ({
  roleId,
  updateUser,
  updateOutcome,
  deleteOutcome,
  deleteManualIO, // ✅ принимаем
  openModal,
}: BuildColumnsProps): ColumnDef<IncomeOutcomeProps | any>[] => {
  return [
    {
      accessorKey: "date",
      header: "Дата",
      cell: ({ row }) => formatDate(row.original.createdDate, "dd.MM.yy HH:mm"),
    },
    {
      accessorKey: "type",
      header: "Тип",
      cell: ({ row }) => (
        <Badge
          variant={row.original.type === "income" ? "default" : "destructive"}
          className={
            row.original.type === "income" ? "bg-green-500" : "bg-red-500"
          }
        >
          {row.original.type === "income" ? "Приход" : "Расход"}
        </Badge>
      ),
    },
    {
      id: "orderNum",
      header: "Номер заказа",
      cell: ({ row }) =>
        row.original.order ? (
          <Badge>{row.original.order.title}</Badge>
        ) : (
          <div>-</div>
        ),
    },
    {
      accessorKey: "description",
      header: "Описание",
      cell: ({ row }) => (
        <div className="max-w-xs whitespace-normal">{row.original.note}</div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Сумма",
      cell: ({ row }) => (
        <Badge
          variant={row.original.type === "income" ? "default" : "destructive"}
          className={
            row.original.type === "income" ? "bg-green-500" : "bg-red-500"
          }
        >
          {row.original.type === "expense" ? "-" : ""}
          {row.original.count?.toLocaleString?.() ?? 0} ₽
        </Badge>
      ),
    },
    {
      accessorKey: "author",
      header: "Менеджер",
      cell: ({ row }) => (
        <Badge>{formatName(row.original.author) || "Не указан"}</Badge>
      ),
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="flex justify-end gap-2">
            {/* ✏️ Редактирование */}
            {roleId === 3 && (
              <Button
                variant="outline"
                onClick={() =>
                  openModal("incomeOutcome", {
                    title:
                      item.type === "income"
                        ? "Редактировать приход"
                        : "Редактировать расход",
                    props: {
                      type: item.type,
                      item,
                      isEdit: true,
                    },
                  })
                }
              >
                <PencilIcon />
              </Button>
            )}

            {/* ✅ Подтверждение */}
            {roleId === 3 && item.source !== "manual" && (
              <>
                {item.isApproved ? (
                  <Button disabled>
                    <CheckCheckIcon />
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="bg-green-500"
                    onClick={() => {
                      if (item.type === "expense") {
                        updateOutcome?.({
                          documentId: item.documentId,
                          updatedData: { isApproved: true },
                        });

                        if (
                          item.user?.id &&
                          item.outcome_category === "Зарплата сотрудников"
                        ) {
                          updateUser({
                            userId: item.user.id,
                            updatedData: {
                              balance: (item.user.balance || 0) + item.count,
                            },
                          });
                        }
                      }
                    }}
                  >
                    <CheckIcon />
                  </Button>
                )}
              </>
            )}

            {/* 🔗 Ссылка на заказ */}
            <Button variant={"secondary"} disabled={!item.order} asChild>
              <Link
                href={`/orders/${item.order?.documentId}`}
                className={cn(!item.order && "pointer-events-none opacity-50")}
              >
                <Link2Icon />
              </Link>
            </Button>

            {/* 🗑 Удаление */}
            {roleId === 3 && (
              <Button
                variant="destructive"
                onClick={async () => {
                  const confirmDelete = confirm("Удалить эту запись?");
                  if (!confirmDelete) return;
                  try {
                    if (item.source === "manual") {
                      await deleteManualIO(item.documentId);

                      // обновляем баланс
                      if (item.user?.id) {
                        const delta =
                          item.type === "income" ? -item.count : item.count;
                        await updateUser({
                          userId: item.user.id,
                          updatedData: {
                            balance: (item.user.balance || 0) + delta,
                          },
                        });
                      }
                    } else if (item.type === "income") {
                      // ✅ удаляем обычный расход
                      if (
                        item.isApproved &&
                        item.user?.id &&
                        item.outcome_category === "Зарплата сотрудников"
                      ) {
                        await updateUser({
                          userId: item.user.id,
                          updatedData: {
                            balance: (item.user.balance || 0) - item.count,
                          },
                        });
                      }
                      await deleteOutcome(item.documentId);
                    }
                  } catch (err) {
                    console.error("Ошибка при удалении:", err);
                    alert("Не удалось удалить запись. Попробуйте позже.");
                  }
                }}
              >
                <Trash2Icon />
              </Button>
            )}
          </div>
        );
      },
    },
  ];
};
