/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format, startOfDay, endOfDay, parseISO } from "date-fns"
import { CalendarIcon, CheckIcon, ChevronsUpDown } from "lucide-react"
import { DateRange } from "react-day-picker"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

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
import { useAuth } from "@/providers/auth-provider"

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
    const { roleId } = useAuth();

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
            filters.master = { id: { $eq: values.master } };
        }

        onChange(filters);
    };

    const searchParams = useSearchParams()

    // === helpers для (de)serialize ===
    const toStr = (d?: Date) => (d ? format(d, "yyyy-MM-dd") : "")
    const fromStr = (s?: string | null) => (s ? parseISO(s) : undefined)

    // === 1) При монтировании восстанавливаем значения из URL ===
    useEffect(() => {
        const drFrom = fromStr(searchParams.get("dr_from"))
        const drTo = fromStr(searchParams.get("dr_to"))
        const vrFrom = fromStr(searchParams.get("vr_from"))
        const vrTo = fromStr(searchParams.get("vr_to"))
        const master = searchParams.get("master") ?? ""

        // Если в URL что-то есть — восстанавливаем форму
        if (drFrom || drTo || vrFrom || vrTo || master) {
            form.reset({
                dateRange: { from: drFrom, to: drTo },
                dateVisitRange: { from: vrFrom, to: vrTo },
                master,
            })
            // Сразу пробрасываем фильтры вверх (как при submit)
            const filters: Record<string, any> = {}
            if (drFrom || drTo) {
                filters.createdAt = {}
                if (drFrom) filters.createdAt.$gte = startOfDay(drFrom).toISOString()
                if (drTo) filters.createdAt.$lte = endOfDay(drTo).toISOString()
            }
            if (vrFrom || vrTo) {
                filters.visit_date = {}
                if (vrFrom) filters.visit_date.$gte = startOfDay(vrFrom).toISOString()
                if (vrTo) filters.visit_date.$lte = endOfDay(vrTo).toISOString()
            }
            if (master) filters.master = { id: { $eq: master } }
            onChange(filters)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const sub = form.watch((values) => {
            const params = new URLSearchParams(window.location.search)

            // dateRange
            const df = values.dateRange?.from ? toStr(values.dateRange.from) : ""
            const dt = values.dateRange?.to ? toStr(values.dateRange.to) : ""
            df ? params.set("dr_from", df) : params.delete("dr_from")
            dt ? params.set("dr_to", dt) : params.delete("dr_to")

            // dateVisitRange
            const vf = values.dateVisitRange?.from ? toStr(values.dateVisitRange.from) : ""
            const vt = values.dateVisitRange?.to ? toStr(values.dateVisitRange.to) : ""
            vf ? params.set("vr_from", vf) : params.delete("vr_from")
            vt ? params.set("vr_to", vt) : params.delete("vr_to")

            // master
            values.master ? params.set("master", values.master) : params.delete("master")

            const qs = params.toString()
            const next = qs ? `?${qs}` : ""
            // Меняем URL на месте, НЕ выполняя роутинг
            window.history.replaceState(null, "", `${window.location.pathname}${next}`)
        })
        return () => sub.unsubscribe()
    }, [form])

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                onReset={() => {
                    form.reset()
                    onChange({})
                    const path = window.location.pathname
                    window.history.replaceState(null, "", path)
                }}
                className="grid lg:grid-cols-4 items-start gap-4 border rounded-md p-4 mb-6 lg:mb-14"
            >
                {/* Дата создания */}
                <FormField
                    control={form.control}
                    name="dateRange"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Дата создания</FormLabel>
                            <FormControl>
                                <div>
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
                                                    d.setDate(d.getDate() + i);
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
                                    <div className="flex flex-wrap gap-2 p-2">
                                        {["Сегодня", "Вчера", "Позавчера"].map((label, i) => {
                                            const d = new Date();
                                            d.setDate(d.getDate() - i);
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
                                </div>
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
                                <div>
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
                                    <div className="flex flex-wrap gap-2 p-2">
                                        {["Сегодня", "Завтра", "Ч-з 2 дня", "Ч-з 3 дня"].map((label, i) => {
                                            const d = new Date();
                                            d.setDate(d.getDate() + i);
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
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Сотрудник */}
                {roleId !== 1 && (
                    <FormField
                        control={form.control}
                        name="master"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Сотрудник</FormLabel>
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
                                            {users.find((m) => m.id.toString() === field.value)?.name || "Выберите сотрудника"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0">
                                        <Command>
                                            <CommandInput placeholder="Поиск сотрудника..." />
                                            <CommandEmpty>Сотрудник не найден</CommandEmpty>
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
                )}


                <div>
                    <div className="opacity-0 mb-2">
                        <FormLabel>Кнопки</FormLabel>
                    </div>
                    <div className="grid grid-cols-2 gap-4 self-center">
                        <Button type="submit">Применить</Button>
                        <Button type="reset" variant="destructive">Сбросить</Button>
                    </div>
                </div>

            </form>
        </Form>
    )
}