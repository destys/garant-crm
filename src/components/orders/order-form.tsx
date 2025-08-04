/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { CalendarIcon, CheckIcon, ChevronDown } from "lucide-react"
import { format, parseISO } from "date-fns"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
}).superRefine((data, ctx) => {
    if (data.orderStatus === "Отказ" && !data.reason_for_refusal?.trim()) {
        ctx.addIssue({
            path: ["reason_for_refusal"],
            code: z.ZodIssueCode.custom,
            message: "Укажите причину отказа",
        })
    }
})

type FormData = z.infer<typeof schema>

interface Props {
    data?: OrderProps | null
    clientDocumentId?: string
    masterId?: string
}

export function RepairOrderForm({ data, clientDocumentId, masterId }: Props) {
    const router = useRouter();
    const isNew = !data;
    const { settings } = useSettings();
    const { updateOrder, createOrder } = useOrders(1, 1)

    const visitDate = data?.visit_date ? parseISO(data.visit_date) : undefined
    const visitTime = visitDate
        ? `${visitDate.getHours().toString().padStart(2, "0")}:${visitDate.getMinutes().toString().padStart(2, "0")}`
        : ""

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
            diagnostic_date: data?.diagnostic_date ? parseISO(data.diagnostic_date) : undefined,
            date_of_issue: data?.date_of_issue ? parseISO(data.date_of_issue) : undefined,
            deadline: data?.deadline ? parseISO(data.deadline) : undefined,
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
        },
    })

    const status = form.watch("orderStatus")
    const [open, setOpen] = useState(false)

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
            diagnostic_date: value.diagnostic_date?.toISOString(),
            date_of_issue: value.date_of_issue?.toISOString(),
            deadline: value.deadline?.toISOString(),

        }

        delete payload.visit_time;

        if (isNew) {
            const isNewPayload = {
                ...payload,
                client: clientDocumentId ? clientDocumentId : undefined,
                master: masterId ? +masterId : undefined,
            }
            try {
                const created = await createOrder(isNewPayload);

                toast("Заказ создан", {
                    action: {
                        label: "Перейти",
                        onClick: () => router.push(`/orders/${created.documentId}`),
                    },
                })
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
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

                <Button type="submit">Сохранить</Button>
            </form>
        </Form>
    )
}