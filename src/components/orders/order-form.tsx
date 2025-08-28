/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { CalendarIcon, CheckIcon, ChevronDown } from "lucide-react"
import { format, parseISO } from "date-fns"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { useModal } from "@/providers/modal-provider";
import { useAuth } from "@/providers/auth-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover as ShadcnPopover,
    PopoverContent as ShadcnPopoverContent,
    PopoverTrigger as ShadcnPopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ORDER_SOURCES, ORDER_STATUSES, REPAIR_KIND, REPAIR_TYPE } from "@/constants"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { OrderProps } from "@/types/order.types"
import { useOrders } from "@/hooks/use-orders"
import { useSettings } from "@/hooks/use-settings"

const NEED_DEADLINE = new Set(["Согласовать", "Отремонтировать", "Готово"])

// Схема валидации
const schema = z.object({
    orderStatus: z.string(),
    source: z.string().optional(),
    warranty: z.string().optional(),
    type_of_repair: z.string(),
    kind_of_repair: z.string(),
    visit_date: z.date().optional(), // только дата
    visit_time: z.string().optional(), // только время (часы:минуты)
    diagnostic_date: z.date().optional(),
    date_of_issue: z.date().optional(),
    deadline: z.date().optional(),
    device_type: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    serial_number: z.string().optional(),
    reason_for_refusal: z.string().optional(),
    defect: z.string().optional(),
    conclusion: z.string().optional(),
    total_cost: z.string().optional(),
    prepay: z.string().optional(),
    equipment: z.string().optional(),
    completed_work: z.string().optional(),
    note: z.string().optional(),
    add_address: z.string(),
    add_phone: z.string(),
}).superRefine((data, ctx) => {
    if (data.orderStatus === "Отказ") {
        if (!data.reason_for_refusal?.trim()) {
            ctx.addIssue({
                path: ["reason_for_refusal"],
                code: z.ZodIssueCode.custom,
                message: "Укажите причину отказа",
            });
        }
        if (!data.device_type?.trim()) {
            ctx.addIssue({
                path: ["device_type"],
                code: z.ZodIssueCode.custom,
                message: "Укажите тип устройства",
            });
        }
    }

    if (NEED_DEADLINE.has(data.orderStatus) && !data.deadline) {
        ctx.addIssue({ path: ["deadline"], code: z.ZodIssueCode.custom, message: "Укажите дедлайн" })
    }
});

type FormData = z.infer<typeof schema>

interface Props {
    data?: OrderProps | null
    clientDocumentId?: string
    masterId?: string
    onDirtyChange?: (dirty: boolean) => void // ← добавили
}

export function RepairOrderForm({ data, clientDocumentId, masterId, onDirtyChange }: Props) {
    const router = useRouter();
    const isNew = !data;
    const { settings } = useSettings();
    const { updateOrder, createOrder } = useOrders(1, 1)
    const { openModal } = useModal();
    const { user, roleId } = useAuth();

    const visitDate = data?.visit_date ? parseISO(data.visit_date) : undefined
    const visitTime = visitDate
        ? `${visitDate.getHours().toString().padStart(2, "0")}:${visitDate.getMinutes().toString().padStart(2, "0")}`
        : ""


    const toStrapiDate = (d?: Date) => (d ? format(d, "yyyy-MM-dd") : undefined)
    const fromStrapiDate = (s?: string) => (s ? new Date(`${s}T00:00:00`) : undefined)

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            orderStatus: data?.orderStatus || "Новая",
            source: data?.source || "",
            warranty: data?.warranty || "",
            type_of_repair: data?.type_of_repair || "Платный",
            kind_of_repair: data?.kind_of_repair || "Стационарный",
            visit_date: visitDate,
            visit_time: visitTime,
            diagnostic_date: data?.diagnostic_date
                ? fromStrapiDate(data.diagnostic_date)
                : undefined,
            date_of_issue: data?.date_of_issue
                ? fromStrapiDate(data.date_of_issue)
                : undefined,
            deadline: data?.deadline
                ? fromStrapiDate(data.deadline)
                : undefined,
            device_type: data?.device_type || "",
            brand: data?.brand || "",
            model: data?.model || "",
            serial_number: data?.serial_number || "",
            reason_for_refusal: data?.reason_for_refusal || "",
            defect: data?.defect || "",
            conclusion: data?.conclusion || "",
            total_cost: data?.total_cost || "",
            prepay: data?.prepay || "",
            equipment: data?.equipment || "",
            completed_work: data?.completed_work || "",
            note: data?.note || "",
            add_address: data?.add_address || "",
            add_phone: data?.add_phone || "",
        },
    })

    const prepay = form.watch("prepay");
    const prepayDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastOpenedValueRef = useRef<string>("");

    const status = form.watch("orderStatus")
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [createdId, setCreatedId] = useState<string | null>(null);

    // +++ ДОБАВИТЬ эффект (ниже деклараций хуков)
    useEffect(() => {
        if (prepayDebounceRef.current) clearTimeout(prepayDebounceRef.current);

        const value = (prepay ?? "").toString().trim();
        if (!value) return;

        prepayDebounceRef.current = setTimeout(() => {
            // не триггерим для того же значения повторно
            if (lastOpenedValueRef.current === value) return;

            const amount = Number(value.replace(/\s/g, ""));
            if (!Number.isFinite(amount) || amount <= 0) return;

            lastOpenedValueRef.current = value;

            openModal("incomeOutcome", {
                title: "Добавить приход",
                props: {
                    type: "income",
                    orderId: data?.documentId, // при создании нового заказа может быть undefined — это ок
                    masterId:
                        roleId === 1
                            ? (data?.master?.id ??
                                (masterId ? Number(masterId) : undefined))
                            : undefined,
                },
            });
        }, 2000);

        return () => {
            if (prepayDebounceRef.current) clearTimeout(prepayDebounceRef.current);
        };
    }, [prepay, roleId, data?.documentId, data?.master?.id, masterId, openModal]);

    useEffect(() => {
        if (countdown === 0 && createdId) {
            router.push(`/orders/${createdId}`);
        }
    }, [countdown, createdId, router]);

    useEffect(() => {
        onDirtyChange?.(form.formState.isDirty)
    }, [form.formState.isDirty, onDirtyChange])


    const onSubmit = async (value: FormData) => {
        let visitDateTime: string | undefined = undefined;
        if (value.visit_date) {
            const date = new Date(value.visit_date);
            if (value.visit_time) {
                const [hours, minutes] = value.visit_time.split(":");
                date.setHours(Number(hours), Number(minutes));
            }
            visitDateTime = date.toISOString();
        }

        const payload = {
            ...value,
            visit_date: visitDateTime,
            diagnostic_date: toStrapiDate(value.diagnostic_date),
            date_of_issue: toStrapiDate(value.date_of_issue),
            deadline: toStrapiDate(value.deadline),
        }

        delete payload.visit_time;

        if (isNew) {
            if (isNew) setIsSubmitting(true);
            const isNewPayload = {
                ...payload,
                client: clientDocumentId ? clientDocumentId : undefined,
                master: masterId ? +masterId : undefined,
                author: user?.name
            }
            try {
                const created = await createOrder(isNewPayload);
                setCreatedId(created.documentId);
                toast("Заказ создан", {
                    action: {
                        label: "Перейти",
                        onClick: () => router.push(`/orders/${created.documentId}`),
                    },
                })
                const timer = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev === 1) {
                            clearInterval(timer);
                        }
                        return prev - 1;
                    });
                }, 1000);
            } catch (error) {
                console.error(error);
                toast.error("Ошибка при создании заказа");
            }
        } else {
            delete (payload as any).master;
            delete (payload as any).client;

            updateOrder({
                documentId: data!.documentId,
                updatedData: payload,
            })
            toast.success("Заказ обновлен")
        }
    }

    const renderDateField = (name: keyof FormData, label: string) => (
        <FormField
            name={name}
            control={form.control}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? format(field.value, "dd.MM.yyyy") : "Выберите дату"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value as Date} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                </FormItem>
            )}
        />
    )

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField name="add_phone" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Доп. телефон клиента</FormLabel>
                                <FormControl><Input mask="+0 000 000 00-00" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField name="add_address" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Доп. адрес клиента</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <Separator />

                    {/* Общие поля */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <FormField
                            name="orderStatus"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Статус заказа</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Выберите статус" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ORDER_STATUSES.map((item) => (
                                                <SelectItem key={item} value={item}>
                                                    {item}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField name="warranty" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Гарантия</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField
                            name="source"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Источник</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Выберите источник" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ORDER_SOURCES.map((item) => (
                                                <SelectItem key={item} value={item}>
                                                    {item}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        {status === "Отказ" && (
                            <FormField name="reason_for_refusal" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Причина отказа</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Выберите причину отказа" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {settings?.reasons_for_refusal.map((item) => (
                                                <SelectItem key={item.id} value={item.title}>
                                                    {item.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <FormField name="type_of_repair" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Тип ремонта</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Выберите тип" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REPAIR_TYPE.map((item) => (
                                            <SelectItem key={item} value={item}>
                                                {item}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        <FormField name="kind_of_repair" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Вид ремонта</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Выберите вид" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REPAIR_KIND.map((item) => (
                                            <SelectItem key={item} value={item}>
                                                {item}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                    </div>

                    <Separator />

                    {/* Дата выезда */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                {renderDateField("visit_date", "Дата выезда")}
                            </div>
                            <FormField name="visit_time" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Время выезда</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        {renderDateField("diagnostic_date", "Дата диагностики")}
                        {renderDateField("date_of_issue", "Дата выдачи")}
                        {renderDateField("deadline", "Дедлайн")}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <FormField name="device_type" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Тип устройства</FormLabel>
                                <ShadcnPopover open={open} onOpenChange={setOpen}>
                                    <ShadcnPopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                                {field.value || "Выберите устройство"}
                                                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </ShadcnPopoverTrigger>
                                    <ShadcnPopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Поиск..." />
                                            <CommandEmpty>Ничего не найдено</CommandEmpty>
                                            <CommandGroup>
                                                {settings?.types_of_equipment.map((device) => (
                                                    <CommandItem key={device.id} value={device.title} onSelect={() => { form.setValue("device_type", device.title); setOpen(false) }}>
                                                        <CheckIcon className={cn("mr-2 h-4 w-4", device.title === field.value ? "opacity-100" : "opacity-0")} />
                                                        {device.title}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </ShadcnPopoverContent>
                                </ShadcnPopover>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField name="brand" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Производитель</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField name="model" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Модель</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField name="serial_number" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Серийный номер</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                            </FormItem>
                        )} />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <FormField name="equipment" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Комплектация</FormLabel>
                                <FormControl><Textarea {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField name="defect" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Неисправность</FormLabel>
                                <FormControl><Textarea rows={2} {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField name="conclusion" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Заключение</FormLabel>
                                <FormControl><Textarea rows={2} {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField name="completed_work" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Выполненные работы</FormLabel>
                                <FormControl><Textarea rows={2} {...field} /></FormControl>
                            </FormItem>
                        )} />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <FormField name="total_cost" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Общая стоимость</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField name="prepay" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Предоплата</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                            </FormItem>
                        )} />
                    </div>

                    <Separator />

                    <div>
                        <FormField name="note" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Примечание</FormLabel>
                                <FormControl><Textarea rows={2} {...field} /></FormControl>
                            </FormItem>
                        )} />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Сохраняем..." : "Сохранить"}
                        </Button>
                        {isSubmitting && createdId && (
                            <>
                                <span className="text-muted-foreground">Переход через {countdown} сек</span>
                                <Button type="button" variant="secondary" asChild>
                                    <Link href={`/orders/${createdId}`}>
                                        Перейти сейчас
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    )
}