"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { useIncomesAll } from "@/hooks/use-incomes";
import { useOutcomesAll } from "@/hooks/use-outcomes";
import { useIncomes } from "@/hooks/use-incomes";
import { useOutcomes } from "@/hooks/use-outcomes";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

export function FixCreatedDateTool() {
  const { jwt } = useAuth();
  const { updateIncome } = useIncomes(1, 1);
  const { updateOutcome } = useOutcomes(1, 1);

  // 🔹 Фильтр: выбираем только те, где createdDate отсутствует
  const baseFilter = {
    createdDate: { $null: true },
  };

  // Загружаем только нужные доходы и расходы
  const inc = useIncomesAll(baseFilter);
  const out = useOutcomesAll(baseFilter);

  const incomes = inc.data ?? [];
  const outcomes = out.data ?? [];

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFix = async () => {
    if (!jwt) {
      toast.error("Нет токена авторизации");
      return;
    }

    try {
      setLoading(true);
      let fixed = 0;

      const total = incomes.length + outcomes.length;
      if (total === 0) {
        toast.info("Нет записей без createdDate — всё в порядке!");
        return;
      }

      // Обновляем доходы
      for (const item of incomes) {
        if (!item.createdDate && item.createdAt) {
          await new Promise((r) => setTimeout(r, 100));
          updateIncome({
            documentId: item.documentId,
            updatedData: { createdDate: item.createdAt },
          });
          fixed++;
          setProgress(Math.round((fixed / total) * 100));
        }
      }

      // Обновляем расходы
      for (const item of outcomes) {
        if (!item.createdDate && item.createdAt) {
          await new Promise((r) => setTimeout(r, 100));
          updateOutcome({
            documentId: item.documentId,
            updatedData: { createdDate: item.createdAt },
          });
          fixed++;
          setProgress(Math.round((fixed / total) * 100));
        }
      }

      toast.success(`✅ Исправлено ${fixed} записей`);
    } catch (err) {
      console.error(err);
      toast.error("Ошибка при обновлении");
    } finally {
      setLoading(false);
    }
  };

  const isDataLoading = inc.isLoading || out.isLoading;

  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
        <Loader2Icon className="w-6 h-6 animate-spin mb-2 text-muted-foreground" />
        <span className="text-muted-foreground">Загружаем данные...</span>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-start gap-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Исправление createdDate</h2>
      <p className="text-sm text-muted-foreground">
        Найдено без createdDate: доходов — {incomes.length}, расходов —{" "}
        {outcomes.length}
      </p>

      <Button onClick={handleFix} disabled={loading}>
        {loading ? (
          <>
            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
            Обновляем... {progress}%
          </>
        ) : (
          "Заполнить createdDate"
        )}
      </Button>
    </div>
  );
}
