"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { demoOrders, demoMasters } from "@/demo-data"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
    dateRange: z
        .object({
            from: z.date().optional(),
            to: z.date().optional(),
        })
        .refine((data) => !data.from || !data.to || data.from <= data.to, {
            message: "Начальная дата не может быть позже конечной",
            path: ["to"],
        }),
    orderId: z.string().optional(),
    masterId: z.string().optional(),
})

export const AccountingFilters = () => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dateRange: {
                from: undefined,
                to: undefined,
            },
            orderId: "",
            masterId: "all",
        },
    })

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const filtered = {
            ...values,
            masterId: values.masterId === "all" ? undefined : values.masterId,
        }
        console.warn(filtered)
        // TODO: set filters in store
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-3 items-end gap-4 border rounded-md p-4 mb-14">
                <FormField
                    control={form.control}
                    name="dateRange"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Выберите даты</FormLabel>
                            <FormControl>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value?.from && !field.value?.to && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value?.from ? (
                                                field.value.to ? (
                                                    `${format(field.value.from, "dd.MM.yyyy")} – ${format(field.value.to, "dd.MM.yyyy")}`
                                                ) : (
                                                    format(field.value.from, "dd.MM.yyyy")
                                                )
                                            ) : (
                                                <span>Выберите даты</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="range"
                                            selected={field.value as DateRange}
                                            onSelect={field.onChange}
                                            defaultMonth={
                                                field.value?.from
                                                    ? field.value.from
                                                    : new Date(new Date().getFullYear(), new Date().getMonth() - 1)
                                            }
                                            numberOfMonths={2}
                                            className="rounded-lg border shadow-sm"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="orderId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Заказ</FormLabel>
                            <select {...field} className="w-full border rounded px-2 py-1">
                                <option value="">Все</option>
                                {demoOrders.map((order) => (
                                    <option key={order.order_number} value={order.order_number}>
                                        {order.order_number}
                                    </option>
                                ))}
                            </select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="masterId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Мастер</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="w-full justify-between">
                                    <SelectValue placeholder="Выберите мастера" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все</SelectItem>
                                    {demoMasters.map((master) => (
                                        <SelectItem key={master.id} value={String(master.id)}>
                                            {master.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit">Применить</Button>
            </form>
        </Form>
    )
} 