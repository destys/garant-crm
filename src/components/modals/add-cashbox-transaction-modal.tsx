import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { ClientProps } from "@/types/client.types";
import { useCashTransactions } from "@/hooks/use-cash-transactions";
import { useAuth } from "@/providers/auth-provider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSACTION_STATUSES } from "@/constants";
import { useCashbox } from "@/hooks/use-cashbox";

const formSchema = z.object({
  amount: z.string(),
  type: z.string(),
  comment: z.string(),
});

export const AddCashboxTransactionModal = ({
  props,
  close,
}: {
  props?: { orderId?: string; client: ClientProps };
  close: () => void;
}) => {
  const { cashbox, updateCashbox } = useCashbox();
  const { createCashTransaction, updateCashTransaction } = useCashTransactions(
    1,
    1
  );
  const { user, roleId } = useAuth();
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "0",
      comment: "",
      type: props?.client.phone || "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user || !cashbox) return <Loader2Icon className="animate-spin" />;
    const payload = {
      amount: +data.amount,
      type: data.type,
      comment: data.comment,
      user: { id: user.id },
    };

    try {
      setLoading(true);
      if (props?.client.documentId) {
        await updateCashTransaction({
          documentId: props.client.documentId,
          updatedData: payload,
        });
        qc.invalidateQueries({ queryKey: ["order", props?.orderId] });
        toast.success("Пользователь обновлен");
      } else {
        await createCashTransaction(payload);
        toast.success("Пользователь создан");
      }
      if (data.type === "Приход") {
        updateCashbox({ balance: +cashbox.balance + +data.amount });
      }
      if (data.type === "Расход") {
        updateCashbox({ balance: cashbox.balance - +data.amount });
      }
      if (data.type === "Корректировка") {
        updateCashbox({ balance: +data.amount });
      }

      close();
    } catch (e) {
      console.error("Ошибка сохранения транзакции:", e);
      toast.error("Ошибка сохранения транзакции");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* ФИО */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Сумма</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Иванов Иван Иванович"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Телефон */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип операции</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выбрать" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSACTION_STATUSES.filter((status) =>
                        roleId !== 3 ? status === "Приход" : true
                      ).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Телефон */}
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Описание операции</FormLabel>
                <FormControl>
                  <Textarea placeholder="Описание транзакции" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Кнопка */}
          <Button type="submit" className="md:col-span-2" disabled={loading}>
            {loading ? <Loader2Icon className="animate-spin" /> : "Сохранить"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
