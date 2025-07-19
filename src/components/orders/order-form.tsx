'use client'

import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { CheckIcon, ChevronDown } from "lucide-react"

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

const deviceTypes = [
    "Холодильник",
    "Стиральная машина",
    "Винный холодильник",
    "Посудомойка",
    "Духовка",
]

const schema = z.object({
    status: z.string(),
    source: z.string(),
    warranty: z.string(),
    repairType: z.string(),
    repairKind: z.string(),
    visitDate: z.date().optional(),
    visitTime: z.string(),
    diagnosisDate: z.date().optional(),
    issueDate: z.date().optional(),
    deadline: z.date().optional(),
    deviceType: z.string().min(1, "Выберите тип устройства"),
    manufacturer: z.string().min(1),
    model: z.string(),
    modelCode: z.string(),
    serial: z.string(),
    refuseReason: z.string(),
    malfunction: z.string(),
    conclusion: z.string(),
    cost: z.string(),
    prepay: z.string(),
    equipment: z.string(),
    doneWorks: z.string(),
    note: z.string(),
}).superRefine((data, ctx) => {
    if (data.status === "Отказ" && !data.refuseReason?.trim()) {
        ctx.addIssue({
            path: ["refuseReason"],
            code: z.ZodIssueCode.custom,
            message: "Укажите причину отказа",
        })
    }
})

type FormData = z.infer<typeof schema>

export default function RepairOrderForm() {
    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            status: "Новая",
            warranty: "",
            repairType: "",
            repairKind: "",
            visitTime: "",
            deviceType: "",
            manufacturer: "",
            model: "",
            modelCode: "",
            serial: "",
            refuseReason: "",
            malfunction: "",
            conclusion: "",
            cost: "",
            prepay: "",
            equipment: "",
            doneWorks: "",
            note: "",
        },
    })

    const status = form.watch("status");
    const [open, setOpen] = useState(false)
    const onSubmit = (value: FormData) => console.warn(value)

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
                                <Button variant="outline" className={cn("w-full justify-start text-left", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "dd.MM.yyyy") : "Выберите дату"}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                </FormItem>
            )}
        />
    )

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* Общая информация */}
                    <FormField
                        name="status"
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
                        <FormItem><FormLabel>Гарантия (напр. 6 месяцев)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                    <FormField
                        name="source"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Источник</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Выберите статус" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ORDER_SOURCES.map((item) => (
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
                    {status === "Отказ" && (
                        <FormField name="refuseReason" control={form.control} render={({ field }) => (
                            <FormItem className="xl:col-span-3">
                                <FormLabel>Причина отказа</FormLabel>
                                <FormControl>
                                    <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    )}
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* Ремонт */}
                    <FormField name="repairType" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Тип ремонта</FormLabel><FormControl>
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
                            </FormControl>
                        </FormItem>
                    )} />
                    <FormField name="repairKind" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Вид ремонта</FormLabel>
                            <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Выберите тип" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REPAIR_KIND.map((item) => (
                                            <SelectItem key={item} value={item}>
                                                {item}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                        </FormItem>
                    )} />
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className=" col-span-2">
                            {renderDateField("visitDate", "Дата выезда")}
                        </div>
                        <FormField name="visitTime" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel className="whitespace-nowrap">Вр. выезда</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                        )} />
                    </div>
                    {/* Даты и время */}

                    {renderDateField("diagnosisDate", "Дата диагностики")}
                    {renderDateField("issueDate", "Дата выдачи")}
                    {renderDateField("deadline", "Дедлайн")}

                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* Устройство */}
                    <FormField name="deviceType" control={form.control} render={({ field }) => (
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
                                            {deviceTypes.map((device) => (
                                                <CommandItem key={device} value={device} onSelect={() => { form.setValue("deviceType", device); setOpen(false) }}>
                                                    <CheckIcon className={cn("mr-2 h-4 w-4", device === field.value ? "opacity-100" : "opacity-0")} />
                                                    {device}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </ShadcnPopoverContent>
                            </ShadcnPopover>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField name="manufacturer" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Производитель</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                    <FormField name="model" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Модель</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                    <FormField name="serial" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Сер. номер</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <FormField name="equipment" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Комплектация принимаемого оборудования</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                    )} />
                    {/* Диагностика */}
                    <FormField name="malfunction" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Неисправность</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
                    )} />
                    <FormField name="conclusion" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Техническое заключение</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
                    )} />
                    <FormField name="doneWorks" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Выполненные работы</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
                    )} />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* Финансы */}
                    <FormField name="cost" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Общая стоимость работ</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                    <FormField name="prepay" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Предоплата</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                </div>

                <Separator />

                <div className="">
                    {/* Прочее */}
                    <FormField name="note" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Примечание</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
                    )} />
                </div>

                <Button type="submit">Сохранить</Button>
            </form>
        </Form>
    )
}
