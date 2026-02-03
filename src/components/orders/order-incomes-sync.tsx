import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { OrderProps } from "@/types/order.types";
import { useAuth } from "@/providers/auth-provider";
import { useIncomes } from "@/hooks/use-incomes";
import { useOrders } from "@/hooks/use-orders";

import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface Props {
  data: OrderProps;
}

const orderFormSchema = z
  .object({
    total_cost: z
      .string()
      .refine((v) => /^\d+(\.\d+)?$/.test(v), {
        message: "Введите только число",
      })
      .refine((v) => Number(v) >= 0, {
        message: "Сумма не может быть отрицательной",
      }),
    prepay: z
      .string()
      .refine((v) => /^\d+(\.\d+)?$/.test(v), {
        message: "Введите только число",
      })
      .refine((v) => Number(v) >= 0, {
        message: "Сумма не может быть отрицательной",
      }),
  })
  .superRefine((data, ctx) => {
    if (!data.total_cost || !data.prepay) {
      ctx.addIssue({
        path: ["total_cost"],
        code: z.ZodIssueCode.custom,
        message: "Укажите общую сумму и предоплату",
      });
      ctx.addIssue({
        path: ["prepay"],
        code: z.ZodIssueCode.custom,
        message: "Укажите общую сумму и предоплату",
      });
    }

    const total = Number(data.total_cost || 0);
    const prepay = Number(data.prepay || 0);
    if (total < prepay) {
      ctx.addIssue({
        path: ["total_cost"],
        code: z.ZodIssueCode.custom,
        message: "Общая сумма не может быть меньше предоплаты",
      });
    }
  });

export const OrderIncomesSync = ({ data }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const { roleId, user } = useAuth();
  const { createIncome, updateIncome } = useIncomes(1, 1);
  const { updateOrder } = useOrders(1, 1);
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      total_cost: data?.total_cost || "0",
      prepay: data?.prepay || "0",
    },
  });

  const onSubmit = async (value: z.infer<typeof orderFormSchema>) => {
    //Предоплата
    const orderPrepayValue = data.incomes.find((item) =>
      item.note.includes("(предоплата)"),
    );
    //Доплата
    const orderSurchargeValue = data.incomes.find((item) =>
      item.note.includes("(доплата)"),
    );

    try {
      setIsLoading(true);
      if (orderPrepayValue?.documentId && orderSurchargeValue?.documentId) {
        await updateIncome({
          documentId: orderPrepayValue?.documentId,
          updatedData: {
            count: +value.prepay,
            isApproved: roleId === 3,
            user: {
              id: user?.id,
            },
          },
        });
        await updateIncome({
          documentId: orderSurchargeValue?.documentId,
          updatedData: {
            count: +value.total_cost - +value.prepay,
            isApproved: roleId === 3,
            user: {
              id: user?.id,
            },
          },
        });
      }

      if (!orderPrepayValue) {
        await createIncome({
          count: +value.prepay,
          isApproved: roleId === 3,
          order: data.documentId,
          user: user?.id,
          income_category: "Оплата за ремонт",
          note: "Автосоздание (предоплата)",
        });
      }

      if (!orderSurchargeValue) {
        await createIncome({
          count: +value.total_cost - +value.prepay,
          isApproved: roleId === 3,
          order: data.documentId,
          user: user?.id,
          income_category: "Оплата за ремонт",
          note: "Автосоздание (доплата)",
        });
      }

      await updateOrder({
        documentId: data.documentId,
        updatedData: {
          total_cost: value.total_cost,
          prepay: value.prepay,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["order", data.documentId] });
      toast.success("Стоимость работ обновлена");
    } finally {
      setIsLoading(false);
    }

    queryClient.invalidateQueries({ queryKey: ["incomes"] });
  };

  if (!data || !user) return null;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="border rounded-2xl p-4 mt-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="total_cost"
            control={form.control}
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Общая стоимость</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="prepay"
            control={form.control}
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Предоплата</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <Button>
          {isLoading ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            "Сохранить стоимость"
          )}
        </Button>
      </form>
    </Form>
  );
};
