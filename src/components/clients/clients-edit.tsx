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
import { ClientProps } from '@/types/client.types'

const formSchema = z
    .object({
        name: z.string().min(3, "Введите ФИО"),
        phone: z.string().min(10, "Введите корректный телефон"),
        address: z.string(),
    })

type MasterFormValues = z.infer<typeof formSchema>


export const ClientsEdit = ({ data }: { data: ClientProps }) => {
    const { updateClient } = useClients(1, 1);
    const [loading, setLoading] = useState(false);
    const form = useForm<MasterFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: data.name || "",
            phone: data.phone || "",
            address: data.address || "",
        },
    })

    const onSubmit = async (values: MasterFormValues) => {
        const payload = {
            name: values.name,
            phone: values.phone,
            address: values.address,
        };

        try {
            setLoading(true)
            await updateClient({
                documentId: data.documentId,
                updatedData: payload
            });

            toast.success('Пользователь изменен')
        } catch (e) {
            console.error("Ошибка изменения пользователя:", e);
            toast.success('Ошибка изменения пользователя')
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
                                    <Input placeholder="+7 (999) 123-45-67" mask="+0 (000) 000-00-00" {...field} />
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
    )
}
