/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useIncomes } from "@/hooks/use-incomes";
import { useOutcomes, useOutcomesAll } from "@/hooks/use-outcomes";
import { useUsers } from "@/hooks/use-users";
import { useModal } from "@/providers/modal-provider";
import { useAuth } from "@/providers/auth-provider";
import { AccountingTable } from "@/components/accounting/accounting-table";
import { UserProps } from "@/types/user.types";
import { useManualIncomesOutcomes } from "@/hooks/use-manual-incomes-outcomes";

import { buildMasterAccountingColumns } from "./master-accounting-columns";

interface Props {
  data: UserProps;
}

export const MasterAccounting = ({ data }: Props) => {
  const [filterType, setFilterType] = useState<
    "all" | "approved" | "notApproved"
  >("all");

  // Основной фильтр: комбинируем поиск + isApproved
  const baseFilter = useMemo(() => {
    const andConditions: Record<string, any>[] = [
      { user: { id: { $eq: data.id } } },
      { outcome_category: { $eq: "Зарплата сотрудников" } },
    ];

    if (filterType === "approved") {
      andConditions.push({ isApproved: { $eq: true } });
    } else if (filterType === "notApproved") {
      andConditions.push({ isApproved: { $eq: false } });
    }

    return { $and: andConditions };
  }, [filterType, data.id]);

  // Получаем данные с фильтром
  const { updateIncome, deleteIncome } = useIncomes(1, 1);
  const { updateOutcome, deleteOutcome } = useOutcomes(1, 1);

  const { data: manualIO, deleteManualIO } = useManualIncomesOutcomes(1, 100, {
    user: { id: data.id },
  });
  const out = useOutcomesAll(baseFilter);

  const outcomes = out?.data ?? [];

  const { users, updateUser } = useUsers(1, 100);
  const { openModal } = useModal();
  const { roleId } = useAuth();

  const columns = useMemo(
    () =>
      buildMasterAccountingColumns({
        roleId,
        users,
        updateUser,
        updateIncome,
        deleteIncome,
        updateOutcome,
        deleteOutcome,
        deleteManualIO,
        openModal,
      }),
    [roleId, users, updateUser, updateIncome, updateOutcome]
  );

  const allRows: any[] = useMemo(() => {
    return [
      ...outcomes.map((o) => ({ ...o, type: "income" as const })),
      ...manualIO.map((m) => ({
        ...m,
        type: m.type === "income" ? "income" : "outcome",
        source: "manual",
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
  }, [outcomes, manualIO]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          variant={filterType === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("all")}
        >
          Все
        </Button>
        <Button
          variant={filterType === "approved" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("approved")}
        >
          Подтвержденные
        </Button>
        <Button
          variant={filterType === "notApproved" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("notApproved")}
        >
          Не подтвержденные
        </Button>
      </div>

      <AccountingTable data={allRows} columns={columns} />
    </div>
  );
};
