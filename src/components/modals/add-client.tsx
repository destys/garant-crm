// components/modals/ConfirmModal.tsx
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useClients } from "@/hooks/use-clients";


const formSchema = z
    .object({
        name: z.string().min(3, "Введите ФИО"),
        phone: z.string().min(10, "Введите корректный телефон"),
        address: z.string(),
    })

type MasterFormValues = z.infer<typeof formSchema>

export const AddClientModal = ({
    close
}: {
    close: () => void;
}) => {
    const { createClient } = useClients(1, 1);
    const [loading, setLoading] = useState(false);

    const form = useForm<MasterFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            phone: "",
            address: "",
        },
    })

    const onSubmit = async (data: MasterFormValues) => {
        const payload = {
            name: data.name,
            phone: data.phone,
            address: data.address,
        };

        try {
            setLoading(true)
            await createClient(payload);

            toast.success('Пользователь создан')
            close();
        } catch (e) {
            console.error("Ошибка создания пользователя:", e);
            toast.success('Ошибка создания пользователя')
        } finally {
            setLoading(false)
        }
    };

    return (
        <div className="space-y-6">

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
                    {/* ФИО */}
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ФИО</FormLabel>
                                <FormControl>
                                    <Input placeholder="Иванов Иван Иванович" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Телефон */}
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Телефон</FormLabel>
                                <FormControl>
                                    <Input placeholder="+7 (999) 123-45-67" mask="+7 (000) 000-00-00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Email */}
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Адрес</FormLabel>
                                <FormControl>
                                    <Input placeholder="Адрес" {...field} />
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