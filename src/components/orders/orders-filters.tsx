/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format, startOfDay, endOfDay } from "date-fns"
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
import { useUsers } from "@/hooks/use-users"

interface OrdersFiltersProps {
    onChange: (filters: Record<string, any>) => void;
}

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
    dateVisitRange: z
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

export const OrdersFilters = ({ onChange }: OrdersFiltersProps) => {
    const { users } = useUsers(1, 100);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dateRange: { from: undefined, to: undefined },
            dateVisitRange: { from: undefined, to: undefined },
            master: "",
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const filters: Record<string, any> = {};

        const from = values.dateRange?.from;
        const to = values.dateRange?.to;
        const visitFrom = values.dateVisitRange?.from;
        const visitTo = values.dateVisitRange?.to;

        // createdAt — нормализуем до границ дня
        if (from || to) {
            filters.createdAt = {};
            if (from) filters.createdAt.$gte = startOfDay(from).toISOString();
            if (to) filters.createdAt.$lte = endOfDay(to).toISOString();
        }

        // visit_date (datetime в Strapi) — тоже границы дня
        if (visitFrom || visitTo) {
            filters.visit_date = {};
            if (visitFrom) filters.visit_date.$gte = startOfDay(visitFrom).toISOString();
            if (visitTo) filters.visit_date.$lte = endOfDay(visitTo).toISOString();
        }

        if (values.master) {
            filters.master = { id: values.master };
        }

        onChange(filters);
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                onReset={() => {
                    form.reset();
                    onChange({});
                }}
                className="grid lg:grid-cols-4 items-end gap-4 border rounded-md p-4 mb-6 lg:mb-14"
            >
                {/* Дата создания */}
                <FormField
                    control={form.control}
                    name="dateRange"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Дата создания</FormLabel>
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
                                        <div className="flex gap-2 p-2 border-t">
                                            {["Завтра", "Послезавтра", "Через 3 дня"].map((label, i) => {
                                                const d = new Date();
                                                d.setDate(d.getDate() + (i + 1));
                                                return (
                                                    <Button
                                                        key={label}
                                                        type="button"
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => field.onChange({ from: d, to: d })}
                                                    >
                                                        {label}
                                                    </Button>
                                                );
                                            })}
                                        </div>
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

                {/* Дата выезда */}
                <FormField
                    control={form.control}
                    name="dateVisitRange"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Дата выезда</FormLabel>
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
                                        <div className="flex gap-2 p-2 border-t">
                                            {["Завтра", "Послезавтра", "Через 3 дня"].map((label, i) => {
                                                const d = new Date();
                                                d.setDate(d.getDate() + (i + 1));
                                                return (
                                                    <Button
                                                        key={label}
                                                        type="button"
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => field.onChange({ from: d, to: d })}
                                                    >
                                                        {label}
                                                    </Button>
                                                );
                                            })}
                                        </div>
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

                {/* Мастер */}
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
                                        {users.find((m) => m.id.toString() === field.value)?.name || "Выберите мастера"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                    <Command>
                                        <CommandInput placeholder="Поиск мастера..." />
                                        <CommandEmpty>Мастер не найден</CommandEmpty>
                                        <CommandGroup>
                                            {users.map((master) => (
                                                <CommandItem
                                                    key={master.id}
                                                    value={master.id.toString()}
                                                    onSelect={(val) => {
                                                        form.setValue("master", val)
                                                    }}
                                                >
                                                    <CheckIcon
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            field.value === master.id.toString() ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {master.name}
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

                <div className="grid grid-cols-2 gap-4">
                    <Button type="submit">Применить</Button>
                    <Button type="reset" variant="destructive">Сбросить</Button>
                </div>
            </form>
        </Form>
    )
}