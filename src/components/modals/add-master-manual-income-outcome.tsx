/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

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
import { useUser } from "@/hooks/use-user";
import { useUsers } from "@/hooks/use-users";
import { useManualIncomesOutcomes } from "@/hooks/use-manual-incomes-outcomes";

const baseSchema = z.object({
  count: z.string().min(1, "Укажите сумму"),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof baseSchema>;

interface Props {
  close: () => void;
  props?: {
    type: "income" | "outcome";
    agent: string;
    masterId: number;
  };
}

export const AddMasterManualIncomeOutcome = ({ close, props }: Props) => {
  const [loading, setLoading] = useState(false);

  const isOutcome = props?.type === "outcome";
  const userId = props?.masterId ? Number(props.masterId) : null;

  const { data: user } = useUser(userId);
  const { updateUser } = useUsers(1, 1);
  const { createManualIO } = useManualIncomesOutcomes(1, 1);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: { count: "0", note: "" },
  });

  if (!user) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Загрузка пользователя…
      </div>
    );
  }

  const normalizeAmount = (v: string) => {
    // поддержка "5,000" или "5 000,75"
    const cleaned = v.replace(/\s+/g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.abs(n) : 0;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      // сумма со знаком
      const amount = normalizeAmount(values.count);
      const signedAmount = isOutcome ? -amount : amount;

      // текущие данные пользователя
      const currentBalance = Number(user.balance ?? 0);

      // запись для incomesOutcomes: count, agent, date, note
      const payload = {
        count: signedAmount,
        type: isOutcome ? "outcome" : "income",
        agent: props?.agent || "",
        note: values.note || "",
        user: {
          id: userId,
        },
      };

      await createManualIO(payload);
      const payloadUser = {
        balance: currentBalance + signedAmount,
      };
      await updateUser({ userId: user.id, updatedData: payloadUser });

      if (props?.masterId) {
        await queryClient.invalidateQueries({
          queryKey: ["user", +props?.masterId],
          exact: false,
        });
      }

      toast.success(isOutcome ? "Расход добавлен" : "Приход добавлен");
      close();
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.message ||
        e?.message ||
        "Не удалось сохранить запись";
      console.error("Ошибка обновления пользователя:", e);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Form {...(form as any)}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Сумма */}
          <FormField
            control={form.control as any}
            name="count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Сумма</FormLabel>
                <FormControl>
                  <Input
                    type="text" // оставляем text, чтобы разрешить "5 000,50"
                    inputMode="decimal"
                    placeholder="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Комментарий */}
          <FormField
            control={form.control as any}
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

          <Button type="submit" className="col-span-2" disabled={loading}>
            {loading ? <Loader2Icon className="animate-spin" /> : "Сохранить"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
