/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import z from "zod";

import { useIncomes } from "@/hooks/use-incomes";
import { useOutcomes } from "@/hooks/use-outcomes";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { WORKSHOP_EXPENSES } from "@/constants";

const incomeSchema = z.object({
    count: z.string(),
    note: z.string().optional(),
});
type IncomeValues = z.infer<typeof incomeSchema>;

const outcomeSchema = z.object({
    count: z.string(),
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

export const AddIncomeOutcomeModal = ({ close, props }: Props) => {
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const { createIncome } = useIncomes(1, 1);
    const { createOutcome } = useOutcomes(1, 1);

    // Определим форму и схему в зависимости от типа
    const isOutcome = props?.type === "outcome";

    const form = useForm<IncomeValues | OutcomeValues>({
        resolver: zodResolver(isOutcome ? outcomeSchema : incomeSchema),
        defaultValues: {
            count: "0",
            note: "",
            outcome_category: "", // безопасно, даже если не используется
        } as any,
    });

    const onSubmit = async (values: IncomeValues | OutcomeValues) => {
        try {
            setLoading(true);
            const payload: Record<string, any> = {
                count: +values.count,
                note: values.note,
                order: props?.orderId,
                user: props?.masterId,
            };

            if (isOutcome) {
                payload.outcome_category = (values as OutcomeValues).outcome_category;
                await createOutcome(payload);
                toast.success("Расход добавлен");
            } else {
                await createIncome(payload);
                toast.success("Доход добавлен");
            }

            await queryClient.refetchQueries({
                queryKey: ["order", String(props?.orderId)],
                exact: true,
            });

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
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                >
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

                    {/* Статья расходов — только если type === outcome */}
                    {isOutcome && (
                        <FormField
                            control={form.control}
                            name="outcome_category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Статья расходов</FormLabel>
                                    <FormControl>
                                        <Select
                                            value={field.value}
                                            onValueChange={(value) => {
                                                field.onChange(value);

                                                // Если note пустой — запишем туда выбранную категорию
                                                const note = form.getValues("note");
                                                if (!note?.trim()) {
                                                    form.setValue("note", value);
                                                }
                                            }}

                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Выберите статью" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {WORKSHOP_EXPENSES.map((item) => (
                                                    <SelectItem key={item} value={item}>
                                                        {item}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

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
                        {loading ? (
                            <Loader2Icon className="animate-spin" />
                        ) : (
                            "Сохранить"
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
};