"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, CheckIcon, ChevronsUpDown } from "lucide-react"
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import { useOrderFilterStore } from "@/stores/order-filters-store"

const masters = [
    { label: "Иванов Иван", value: "ivanov" },
    { label: "Петров Пётр", value: "petrov" },
    { label: "Сидоров Сидор", value: "sidorov" },
]

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
    master: z.string().optional(),
})

export const OrdersFilters = () => {
    const setFilters = useOrderFilterStore((state) => state.setFilters);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dateRange: {
                from: undefined,
                to: undefined,
            },
            master: "",
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        setFilters(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-3 items-end gap-4 border rounded-md p-4 mb-6 lg:mb-14">
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
                    name="master"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Мастер</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                            "w-full justify-between",
                                            !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {masters.find((m) => m.value === field.value)?.label || "Выберите мастера"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                    <Command>
                                        <CommandInput placeholder="Поиск мастера..." />
                                        <CommandEmpty>Мастер не найден</CommandEmpty>
                                        <CommandGroup>
                                            {masters.map((master) => (
                                                <CommandItem
                                                    key={master.value}
                                                    value={master.value}
                                                    onSelect={(val) => {
                                                        form.setValue("master", val)
                                                    }}
                                                >
                                                    <CheckIcon
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            field.value === master.value ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {master.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit">Применить</Button>
            </form>
        </Form>
    )
}