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
}: BuildColumnsProps): ColumnDef<IncomeOutcomeProps>[] => {
  return [
    {
      accessorKey: "date",
      header: "Дата",
      cell: ({ row }) => formatDate(row.original.createdAt, "dd.MM.yy HH:mm"),
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
      cell: ({ row }) => row.original.note,
    },
    {
      accessorKey: "masterId",
      header: "Сотрудник",
      cell: ({ row }) => {
        const master = users.find((m) => m.id === row.original.user?.id);
        return master ? master.name : "—";
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
          {row.original.type === "expense" ? "-" : ""}
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
        <div className="space-x-2">
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
                    if (row.original.type === "expense") {
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
                if (row.original.type === "income") {
                  deleteIncome?.(row.original.documentId);
                }
                if (row.original.type === "expense") {
                  deleteOutcome?.(row.original.documentId);
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
