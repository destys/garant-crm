"use client";

import { Loader2Icon, PlusCircleIcon } from "lucide-react";

import { useModal } from "@/providers/modal-provider";
import { Button } from "@/components/ui/button";
import { CashboxTable } from "@/components/cashbox/cashbox-table";
import { useCashTransactions } from "@/hooks/use-cash-transactions";
import { useCashbox } from "@/hooks/use-cashbox";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

export const CashboxContent = () => {
  const { openModal } = useModal();
  const { items, deleteCashTransaction, isLoading } = useCashTransactions(
    1,
    100
  );
  const { cashbox, isLoading: cashboxLoading } = useCashbox();
  const { roleId } = useAuth();

  if (cashboxLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cashbox) return null;
  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="flex-auto">Все операции по кассе</h1>
        <div className="flex items-center gap-3 text-xl font-medium">
          Баланс кассы:{" "}
          <span
            className={cn(
              "text-2xl text-green-500",
              cashbox.balance < 0 && "text-red-500"
            )}
          >
            {cashbox?.balance} ₽
          </span>
        </div>
      </div>
      <Button
        className="mb-10"
        onClick={() =>
          openModal("addTransaction", { title: "Добавить транзакцию" })
        }
      >
        <PlusCircleIcon />
        Добавить операцию
      </Button>
      <CashboxTable
        data={items}
        deleteTransaction={() => (roleId !== 1 ? deleteCashTransaction : null)}
        isLoading={isLoading}
      />
    </div>
  );
};
