/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import z from "zod";

import { useOutcomes } from "@/hooks/use-outcomes";
import { useUsers } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/providers/auth-provider";

const outcomeSchema = z.object({
  count: z.string(),
  master: z.string(),
  note: z.string().optional(),
  outcome_category: z.string().min(1, "Выберите статью расходов"),
});
type OutcomeValues = z.infer<typeof outcomeSchema>;

interface Props {
  close: () => void;
  props?: {
    type: "income" | "outcome";
    orderId: string;
    masterId: number;
  };
}

const SALARY_LABEL = "Зарплата сотрудников";

export const ShiftBalanceModal = ({ close, props }: Props) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { createOutcome } = useOutcomes(1, 1);
  const { updateBalanceAtomic } = useUsers(1, 1);
  const { user, roleId } = useAuth();

  const masterId = props?.masterId ? Number(props.masterId) : null;

  const form = useForm<OutcomeValues>({
    resolver: zodResolver(outcomeSchema),
    defaultValues: {
      count: "0",
      note: "Оплата за смену",
      outcome_category: SALARY_LABEL,
      master: props?.masterId ? props.masterId.toString() : "",
    },
  });

  const onSubmit = async (values: OutcomeValues) => {
    try {
      setLoading(true);
      const countNum = +values.count;

      const payload: Record<string, any> = {
        count: countNum,
        note: values.note,
        user: masterId, // Используем ID мастера, а не текущего пользователя
        author: user?.name,
        isApproved: roleId === 3,
        outcome_category: SALARY_LABEL,
      };

      await createOutcome(payload);

      // Атомарно обновляем баланс мастера если админ
      if (roleId === 3 && masterId) {
        await updateBalanceAtomic({
          userId: masterId,
          delta: countNum,
        });
      }

      toast.success("Зарплата добавлена");

      await queryClient.refetchQueries({
        queryKey: ["order", String(props?.orderId)],
        exact: true,
      });

      // Инвалидируем данные мастера
      if (masterId) {
        await queryClient.invalidateQueries({
          queryKey: ["user", masterId],
          exact: false,
        });
      }

      close();
    } catch (e) {
      console.error("Ошибка создания:", e);
      toast.error("Ошибка создания");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Сумма */}
          <FormField
            control={form.control}
            name="count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Сумма</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Комментарий */}
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Комментарий</FormLabel>
                <FormControl>
                  <Textarea placeholder="Комментарий" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Кнопка */}
          <Button type="submit" className="col-span-2" disabled={loading}>
            {loading ? <Loader2Icon className="animate-spin" /> : "Сохранить"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
