/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  CheckCheckIcon,
  CheckIcon,
  HandIcon,
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
  updateBalanceAtomic: (args: {
    userId: number;
    delta: number;
  }) => Promise<any>;
  updateIncome: any;
  updateOutcome: any;
  deleteIncome: any;
  deleteOutcome: any;
  deleteManualIO: any;
  openModal: (a: string, b: any) => void;
  onDeleteSuccess?: () => void; // Callback для обновления UI после удаления
}

export const buildMasterAccountingColumns = ({
  roleId,
  updateBalanceAtomic,
  updateOutcome,
  deleteOutcome,
  deleteIncome,
  deleteManualIO,
  openModal,
  onDeleteSuccess,
}: BuildColumnsProps): ColumnDef<IncomeOutcomeProps | any>[] => {
  return [
    {
      accessorKey: "date",
      header: "Дата",
      cell: ({ row }) =>
        formatDate(
          row.original.createdDate || row.original.createdAt,
          "dd.MM.yy HH:mm",
        ),
    },
    {
      accessorKey: "type",
      header: "Тип",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Badge
            variant={row.original.type === "income" ? "default" : "destructive"}
            className={
              row.original.type === "income" ? "bg-green-500" : "bg-red-500"
            }
          >
            {row.original.type === "income" ? "Приход" : "Расход"}
          </Badge>
          {row.original.source === "manual" && (
            <Badge variant="outline" className="text-xs w-fit">
              <HandIcon />
            </Badge>
          )}
        </div>
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
                      item.type === "outcome"
                        ? "Редактировать приход"
                        : "Редактировать расход",
                    props: {
                      type: item.type === "outcome" ? "income" : "outcome",
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
                    onClick={async () => {
                      const confirmApprove = confirm("Подтвердить запись?");
                      if (!confirmApprove) return;
                      if (item.type === "income") {
                        await updateOutcome?.({
                          documentId: item.documentId,
                          updatedData: { isApproved: true },
                        });

                        // Атомарно обновляем баланс
                        if (
                          item.user?.id &&
                          item.outcome_category === "Зарплата сотрудников"
                        ) {
                          await updateBalanceAtomic({
                            userId: item.user.id,
                            delta: item.count,
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

                      // Атомарно обновляем баланс
                      // При создании: income добавляет +count, outcome добавляет -count (отрицательный)
                      // При удалении: всегда инвертируем (- count), чтобы отменить эффект
                      if (item.user?.id) {
                        const delta = -item.count;
                        await updateBalanceAtomic({
                          userId: item.user.id,
                          delta,
                        });
                      }
                    } else if (item.type === "income") {
                      // расход
                      if (
                        item.isApproved &&
                        item.user?.id &&
                        item.outcome_category === "Зарплата сотрудников"
                      ) {
                        await updateBalanceAtomic({
                          userId: item.user.id,
                          delta: -item.count,
                        });
                      }
                      await deleteOutcome(item.documentId);
                    } else if (item.type === "outcome") {
                      // доход
                      if (
                        item.isApproved &&
                        item.user?.id &&
                        item.outcome_category === "Зарплата сотрудников"
                      ) {
                        await updateBalanceAtomic({
                          userId: item.user.id,
                          delta: -item.count,
                        });
                      }
                      await deleteIncome(item.documentId);
                    }
                    // Обновляем UI после успешного удаления
                    onDeleteSuccess?.();
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
