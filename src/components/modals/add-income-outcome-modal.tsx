import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Loader2Icon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useOutcomes } from "@/hooks/use-outcomes";
import { useIncomes } from "@/hooks/use-incomes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea";

const formSchema = z
    .object({
        count: z.string(),
        note: z.string().optional(),
    })

interface Props {
    close: () => void;
    props: {
        type: 'income' | 'outcome'
        orderId: string;
        masterId: number;
    }
}

type IncomesOutcomeFormValues = z.infer<typeof formSchema>


export const AddIncomeOutcomeModal = ({ close, props }: Props) => {
    const [loading, setLoading] = useState(false);
    const { createIncome } = useIncomes(1, 1)
    const { createOutcome } = useOutcomes(1, 1)
    const queryClient = useQueryClient();

    const form = useForm<IncomesOutcomeFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            count: "0",
            note: "",
        },
    })

    const onSubmit = async (values: IncomesOutcomeFormValues) => {
        const payload = {
            count: +values.count,
            note: values.note,
            order: props.orderId,
            user: props.masterId,
        };

        try {
            setLoading(true)
            if (props.type === 'income') {
                await createIncome(payload);
                toast.success('Доход добавлен')
            }

            if (props.type === 'outcome') {
                await createOutcome(payload);
                toast.success('Расход добавлен')
            }

            await queryClient.refetchQueries({
                queryKey: ["order", String(props.orderId)],
                exact: true
            });

            close();
        } catch (e) {
            console.error("Ошибка создания пользователя:", e);
            toast.success('Ошибка создания пользователя')
        } finally {
            setLoading(false)
        }
    };

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
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

                    {/* Телефон */}
                    <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Телефон</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Комменарий" {...field} />
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
    )
}
