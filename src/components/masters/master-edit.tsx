'use client'

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { UserProps } from "@/types/user.types";
import { useUsers } from "@/hooks/use-users"

const formSchema = z.object({
    name: z.string().min(3, "Введите ФИО"),
    phone: z.string().min(10, "Введите корректный телефон"),
    email: z.string().email("Введите корректный email"),
    role: z.string(),
})

type MasterFormValues = z.infer<typeof formSchema>

export const MasterEdit = ({ data }: { data: UserProps }) => {
    const { updateUser } = useUsers(1, 1);
    const form = useForm<MasterFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: data.name || "",
            phone: data.phone || "",
            email: data.email || "",
            role: data.role.id.toString(),
        },
    })

    const onSubmit = async (values: MasterFormValues) => {
        console.warn("📦 Данные мастера:", data)
        const payload = {
            name: values.name,
            phone: values.phone,
            email: values.email,
            role: +values.role,
        }

        try {
            await updateUser({ userId: data.id, updatedData: payload });
            toast.success('Данные пользователя обновлены')
        } catch (e) {
            console.error(e)
            toast.error('Ошибка обновления данных')
        }

    }

    return (
        <div className="flex flex-col gap-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-auto">
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
                                    <Input placeholder="+7 (999) 123-45-67" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Email */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="example@mail.ru" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Роль */}
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Роль</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите роль" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="1">Мастер</SelectItem>
                                        <SelectItem value="4">Менеджер</SelectItem>
                                        <SelectItem value="3">Администратор</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Кнопка */}
                    <Button type="submit">Сохранить</Button>
                </form>
            </Form>
        </div>
    )
}