/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { Link2Icon, Trash2Icon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { UserProps } from "@/types/user.types";
import { IncomeOutcomeProps } from "@/types/income-outcome.types";
import { ManualIncomeOutcomeProps } from "@/types/manual-io.types";
import { useManualIncomesOutcomes } from "@/hooks/use-manual-incomes-outcomes";
import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/providers/auth-provider";

// универсальный timestamp
const toTs = (dateStr?: string | null) => {
  if (!dateStr) return 0;
  if (dateStr.includes("-") || dateStr.includes("T")) {
    const t = new Date(dateStr).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  const parts = dateStr.split(".").map(Number);
  if (parts.length >= 3) {
    const [d, m, y] = parts;
    const t = new Date(y, (m || 1) - 1, d || 1).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  return 0;
};

type Row = {
  id: number | string;
  documentId: string;
  createdAt: string;
  note: string;
  amountAbs: number;
  type: "income" | "expense";
  source: "income" | "outcome" | "manual";
  orderDocumentId?: string;
};

const normalizeOutcome = (o: IncomeOutcomeProps): Row => {
  const raw = Number(o.count ?? 0);
  const isSalary =
    o.outcome_category?.trim().toLowerCase() === "зарплата сотрудников";

  return {
    id: o.id,
    documentId: o.documentId,
    createdAt: o.createdAt,
    note: o.note ?? "",
    amountAbs: Math.abs(raw),
    type: isSalary ? "income" : "expense",
    source: "outcome",
    orderDocumentId: o.order?.documentId || undefined,
  };
};

const normalizeManual = (m: ManualIncomeOutcomeProps): Row => {
  const raw = Number(m.count ?? 0);
  const typeLower = (m.type || "").toLowerCase();
  const isIncome =
    typeLower === "income" ||
    typeLower === "приход" ||
    (typeLower !== "expense" && raw > 0);

  return {
    id: m.id,
    documentId: m.documentId,
    createdAt: m.createdAt,
    note: m.note ?? "",
    amountAbs: Math.abs(raw),
    type: isIncome ? "income" : "expense",
    source: "manual",
  };
};

export const MasterAccounting = ({ data }: { data: UserProps }) => {
  const outcomes: IncomeOutcomeProps[] = (data as any).outcomes ?? [];
  const manual: ManualIncomeOutcomeProps[] =
    (data as any).manual_income_outcomes ?? [];

  const { deleteManualIO } = useManualIncomesOutcomes(1, 1);
  const { updateUser } = useUsers(1, 1);
  const { roleId } = useAuth();

  const queryClient = useQueryClient();

  const rows: Row[] = [
    ...outcomes.map(normalizeOutcome),
    ...manual.map(normalizeManual),
  ].sort((a, b) => toTs(b.createdAt) - toTs(a.createdAt));

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "createdAt",
      header: "Дата",
      cell: ({ row }) => row.original.createdAt,
    },
    {
      accessorKey: "type",
      header: "Тип",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Badge
            variant={row.original.type === "income" ? "default" : "destructive"}
            className={
              row.original.type === "income" ? "bg-green-500" : "bg-red-500"
            }
          >
            {row.original.type === "income" ? "Приход" : "Расход"}
          </Badge>
          {row.original.source === "manual" && (
            <span title="Ручная операция" className="text-xs text-gray-400">
              📝
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "note",
      header: "Описание",
      cell: ({ row }) => row.original.note || "",
    },
    {
      accessorKey: "amountAbs",
      header: "Сумма",
      cell: ({ row }) => (
        <Badge
          variant={row.original.type === "income" ? "default" : "destructive"}
          className={
            row.original.type === "income" ? "bg-green-500" : "bg-red-500"
          }
        >
          {row.original.type === "expense" ? "-" : ""}
          {row.original.amountAbs.toLocaleString()} ₽
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center">
          {row.original.orderDocumentId && (
            <Button variant="secondary" asChild>
              <Link href={`/orders/${row.original.orderDocumentId}`}>
                <Link2Icon />
              </Link>
            </Button>
          )}

          {/* показываем удаление только для role === 3 и ручных операций */}
          {roleId === 3 && row.original.source === "manual" && (
            <Button
              variant="destructive"
              size="icon"
              onClick={async () => {
                const confirmDelete = confirm("Удалить эту запись?");
                if (!confirmDelete) return;

                try {
                  // 🗑 1. Удаляем запись
                  await deleteManualIO(String(row.original.documentId));

                  // 💰 2. После успешного удаления — пересчитываем баланс
                  const delta =
                    row.original.type === "income"
                      ? -row.original.amountAbs
                      : +row.original.amountAbs;

                  if (data.id) {
                    await updateUser({
                      userId: data.id,
                      updatedData: {
                        balance: (data.balance || 0) + delta,
                      },
                    });
                  }

                  if (data.id) {
                    await queryClient.invalidateQueries({
                      queryKey: ["user", data.id],
                      exact: false,
                    });
                  }
                } catch (error) {
                  console.error("Ошибка при удалении ручной операции:", error);
                  alert("Не удалось удалить запись. Попробуйте позже.");
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

  return (
    <div>
      <div className="flex justify-between items-center gap-4 mb-3">
        <h2 className="flex-auto">Движения по балансу</h2>
      </div>
      <DataTable data={rows} columns={columns} />
    </div>
  );
};
