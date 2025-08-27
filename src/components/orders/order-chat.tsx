"use client"

import { useEffect, useRef } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { format } from "date-fns"

import { OrderProps } from "@/types/order.types"
import { useAuth } from "@/providers/auth-provider"
import { useOrders } from "@/hooks/use-orders"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const formSchema = z.object({
    message: z.string().trim().min(1, "Введите сообщение"),
})

type FormValues = z.infer<typeof formSchema>

export const OrderChat = ({ data }: { data: OrderProps }) => {
    const { user } = useAuth()

    const { updateOrder } = useOrders(1, 1)
    const qc = useQueryClient()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { message: "" },
    })

    const currentChat = data.chat;

    const endRef = useRef<HTMLDivElement | null>(null)
    const scrollToBottom = () =>
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })

    useEffect(() => {
        scrollToBottom()
    }, [currentChat?.length])

    useEffect(() => {
        scrollToBottom()
    }, [currentChat])

    if (!user) return null;
    const userId = user.id;

    const onSubmit = async (values: FormValues) => {
        if (!user) return null;
        const newMessage = {
            message: values.message.trim(),
            user: { id: userId, name: user.name },
            datetime: new Date().toISOString(),
        }

        // Убираем лишние поля у старых сообщений, оставляя только user: { id }
        const sanitizedChat = currentChat.map(({ message, user, datetime }) => ({
            message,
            user: { id: user.id, name: user.name },
            datetime,
        }))

        // Собираем полный массив: все текущие + новое
        const nextChat = [...sanitizedChat, newMessage]

        try {
            await updateOrder({
                documentId: data.documentId,
                updatedData: { chat: nextChat },
            })

            qc.invalidateQueries({ queryKey: ["order", data.documentId] })

            form.reset({ message: "" })
            scrollToBottom()
            toast.success("Сообщение отправлено")
        } catch (e) {
            console.error("Ошибка обновления чата:", e)
            toast.error("Не получилось отправить сообщение")
        }
    }


    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Чат по заказу #{data?.title ?? data?.id}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <ScrollArea className="h-[40dvh] rounded border p-3">
                    <div className="flex flex-col gap-3">
                        {currentChat?.length ? (
                            currentChat.map((m, idx) => {
                                const isMine = m.user?.id === userId
                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "w-3/5 rounded-md border p-2 mb-2",
                                            isMine
                                                ? "ml-auto bg-black text-white"
                                                : "mr-auto bg-white text-black"
                                        )}
                                    >
                                        <div className="flex justify-between gap-5 mb-5 text-xs opacity-70">
                                            <div className="">
                                                {format(new Date(m.datetime), "dd.MM.yyyy HH:mm:ss")}
                                            </div>
                                            <div>
                                                {m.user.name}
                                            </div>
                                        </div>
                                        <div className="font-medium text-sm whitespace-pre-wrap">{m.message}</div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-sm text-muted-foreground">Сообщений пока нет.</div>
                        )}
                    </div>
                    <div ref={endRef} />
                </ScrollArea>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3">
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Сообщение</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Напишите сообщение…"
                                            className="min-h-24"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <CardFooter className="p-0">
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                                        Отправка…
                                    </>
                                ) : (
                                    "Отправить"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}