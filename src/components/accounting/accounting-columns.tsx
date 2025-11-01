// src/components/accounting/accounting-columns.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  CheckCheckIcon,
  CheckIcon,
  ImageIcon,
  Link2Icon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IncomeOutcomeProps } from "@/types/income-outcome.types";
import { cn, formatDate, formatName } from "@/lib/utils";
import { API_URL } from "@/constants";

interface BuildColumnsProps {
  roleId: number | null;
  users: any[];
  updateUser: (args: any) => void;
  updateIncome: any;
  updateOutcome: any;
  deleteIncome: any;
  deleteOutcome: any;
  setLightboxImages: (images: { src: string }[]) => void;
  setLightboxIndex: (index: number) => void;
  openModal: (a: string, b: any) => void;
}

export const buildAccountingColumns = ({
  roleId,
  users,
  updateUser,
  updateIncome,
  updateOutcome,
  deleteIncome,
  deleteOutcome,
  setLightboxImages,
  setLightboxIndex,
  openModal,
}: BuildColumnsProps): ColumnDef<IncomeOutcomeProps>[] => {
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
      accessorKey: "masterId",
      header: "Сотрудник",
      cell: ({ row }) => {
        const master = users.find((m) => m.id === row.original.user?.id);
        return master ? formatName(master.name) : "—";
      },
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
          {row.original.type === "outcome" ? "-" : ""}
          {row.original.count.toLocaleString()} ₽
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
      accessorKey: "orderId",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          {roleId === 3 && (
            <Button
              variant="outline"
              onClick={() =>
                openModal("incomeOutcome", {
                  title:
                    row.original.type === "income"
                      ? "Редактировать приход"
                      : "Редактировать расход",
                  props: {
                    type: row.original.type,
                    item: row.original,
                    isEdit: true,
                  },
                })
              }
            >
              <PencilIcon />
            </Button>
          )}
          {roleId === 3 && (
            <>
              {row.original.isApproved ? (
                <Button disabled>
                  <CheckCheckIcon />
                </Button>
              ) : (
                <Button
                  variant="default"
                  className="bg-green-500"
                  onClick={() => {
                    if (row.original.type === "outcome") {
                      updateOutcome?.({
                        documentId: row.original.documentId,
                        updatedData: { isApproved: true },
                      });
                      if (
                        row.original.user?.id &&
                        row.original.outcome_category === "Зарплата сотрудников"
                      ) {
                        updateUser({
                          userId: row.original.user.id,
                          updatedData: {
                            balance:
                              (row.original.user.balance || 0) +
                              row.original.count,
                          },
                        });
                      }
                    }
                    if (row.original.type === "income") {
                      updateIncome?.({
                        documentId: row.original.documentId,
                        updatedData: { isApproved: true },
                      });
                    }
                  }}
                >
                  <CheckIcon />
                </Button>
              )}
            </>
          )}
          <Button
            disabled={!row.original.photo}
            variant="default"
            onClick={() => {
              setLightboxImages([
                { src: `${API_URL}${row.original.photo.url}` },
              ]);
              setLightboxIndex(0);
            }}
          >
            <ImageIcon />
          </Button>
          <Button
            variant={"secondary"}
            disabled={!!!row.original.order}
            asChild
          >
            <Link
              href={`/orders/${row.original.order?.documentId}`}
              className={cn(
                !!!row.original.order && "pointer-events-none opacity-50"
              )}
            >
              <Link2Icon />
            </Link>
          </Button>
          {roleId === 3 && (
            <Button
              variant="destructive"
              onClick={() => {
                const {
                  type,
                  documentId,
                  isApproved,
                  user,
                  outcome_category,
                  count,
                } = row.original;

                if (type === "income") {
                  deleteIncome?.(documentId);
                }

                if (type === "outcome") {
                  // Если это зарплата и расход был уже подтверждён — списываем с баланса
                  if (
                    isApproved &&
                    user?.id &&
                    outcome_category === "Зарплата сотрудников"
                  ) {
                    updateUser({
                      userId: user.id,
                      updatedData: {
                        balance: (user.balance || 0) - count,
                      },
                    });
                  }

                  // Удаляем сам расход
                  deleteOutcome?.(documentId);
                }
              }}
            >
              <Trash2Icon />
            </Button>
          )}
        </div>
      ),
    },
  ];
};
