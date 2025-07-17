'use client'

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { jsPDF } from "jspdf";
import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

const formSchema = z.object({
    fullName: z.string().min(3, "Введите ФИО"),
    phone: z.string().min(10, "Введите корректный телефон"),
    email: z.string().email("Введите корректный email"),
    role: z.string(),
})

type MasterFormValues = z.infer<typeof formSchema>

export const MasterEdit = () => {
    const form = useForm<MasterFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            phone: "",
            email: "",
            role: "Мастер",
        },
    })

    // Диапазон дат для отчета
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    const handleDownloadPdf = () => {
        // dateRange.from и dateRange.to доступны здесь
        const doc = new jsPDF();
        doc.save("master-report.pdf");
    };

    const onSubmit = (data: MasterFormValues) => {
        console.warn("📦 Данные мастера:", data)
        // TODO: отправка на сервер
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-[260px] justify-start text-left font-normal",
                                !dateRange?.from && !dateRange?.to && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    `${format(dateRange.from, "dd.MM.yyyy")} – ${format(dateRange.to, "dd.MM.yyyy")}`
                                ) : (
                                    format(dateRange.from, "dd.MM.yyyy")
                                )
                            ) : (
                                <span>Выберите даты</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange}
                            defaultMonth={
                                dateRange?.from
                                    ? dateRange.from
                                    : new Date(new Date().getFullYear(), new Date().getMonth() - 1)
                            }
                            numberOfMonths={2}
                            className="rounded-lg border shadow-sm"
                        />
                    </PopoverContent>
                </Popover>
                <Button onClick={handleDownloadPdf}>
                    Сформировать отчет
                </Button>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-auto">
                    {/* ФИО */}
                    <FormField
                        control={form.control}
                        name="fullName"
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите роль" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Мастер">Мастер</SelectItem>
                                        <SelectItem value="Менеджер">Менеджер</SelectItem>
                                        <SelectItem value="Администратор">Администратор</SelectItem>
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