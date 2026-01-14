/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  CalendarIcon,
  CheckIcon,
  ChevronDown,
  Loader2Icon,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/providers/auth-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, getPrefixByKind } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover as ShadcnPopover,
  PopoverContent as ShadcnPopoverContent,
  PopoverTrigger as ShadcnPopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  LEGAL_STATUSES,
  ORDER_STATUSES,
  REPAIR_KIND,
  REPAIR_TYPE,
} from "@/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderProps } from "@/types/order.types";
import {
  IncomeOutcomeProps,
  UpdateIncomeOutcomeDto,
} from "@/types/income-outcome.types";
import { useOrders } from "@/hooks/use-orders";
import { useSettings } from "@/hooks/use-settings";
import { useIncomes } from "@/hooks/use-incomes";

import { Checkbox } from "../ui/checkbox";

const NEED_DEADLINE = new Set(["Согласовать", "Отремонтировать", "Готово"]);

// ============================================================================
// 💰 СИНХРОНИЗАЦИЯ ПРИХОДОВ (ПРЕДОПЛАТА + ДОПЛАТА)
// ============================================================================

interface SyncOrderIncomesParams {
  orderDocumentId: string;
  prepayValue: number;
  totalCostValue: number;
  currentIncomes: IncomeOutcomeProps[];
  currentUserId?: number;
  currentUserName?: string;
  isAdmin: boolean;
  createIncome: (data: Partial<UpdateIncomeOutcomeDto>) => void;
  updateIncome: (params: {
    documentId: string;
    updatedData: Partial<IncomeOutcomeProps>;
  }) => void;
}

/**
 * Находит income по типу (предоплата/доплата) в массиве incomes
 */
const findIncomeByType = (
  incomes: IncomeOutcomeProps[],
  type: "предоплата" | "доплата"
): IncomeOutcomeProps | undefined => {
  return incomes.find((income) => {
    const note = (income.note || "").toLowerCase();
    return note.includes(type);
  });
};

/**
 * Синхронизирует приходы заказа (предоплата и доплата).
 * - Создаёт приходы, если их нет
 * - Обновляет значения, если они изменились
 * - При изменении значения устанавливает текущего пользователя как автора
 */
const syncOrderIncomes = async ({
  orderDocumentId,
  prepayValue,
  totalCostValue,
  currentIncomes,
  currentUserId,
  currentUserName,
  isAdmin,
  createIncome,
  updateIncome,
}: SyncOrderIncomesParams): Promise<void> => {
  const extraValue = totalCostValue - prepayValue;

  // Находим существующие приходы
  const existingPrepay = findIncomeByType(currentIncomes, "предоплата");
  const existingExtra = findIncomeByType(currentIncomes, "доплата");

  // Определяем, изменились ли значения
  const prepayChanged =
    !existingPrepay || (existingPrepay.count ?? 0) !== prepayValue;
  const extraChanged =
    !existingExtra || (existingExtra.count ?? 0) !== extraValue;

  // Базовые данные для обновления (только если значение изменилось)
  const getUpdateData = (
    newCount: number,
    valueChanged: boolean
  ): Partial<IncomeOutcomeProps> => {
    const data: Partial<IncomeOutcomeProps> = {
      count: newCount,
      isApproved: isAdmin,
    };

    // Если значение изменилось — устанавливаем текущего пользователя
    if (valueChanged && currentUserId) {
      (data as any).user = currentUserId;
      data.author = currentUserName;
    }

    return data;
  };

  // === ПРЕДОПЛАТА ===
  if (existingPrepay?.documentId) {
    // Обновляем только если есть изменения ИЛИ если это первое сохранение с нулями
    if (prepayChanged) {
      await updateIncome({
        documentId: existingPrepay.documentId,
        updatedData: getUpdateData(prepayValue, true),
      });
    }
  } else {
    // Создаём новый приход
    await createIncome({
      count: prepayValue,
      income_category: "Оплата за ремонт",
      note: "Автосоздание (предоплата)",
      order: orderDocumentId,
      user: currentUserId,
      author: currentUserName,
      isApproved: isAdmin,
    });
  }

  // === ДОПЛАТА ===
  if (existingExtra?.documentId) {
    // Обновляем только если есть изменения
    if (extraChanged) {
      await updateIncome({
        documentId: existingExtra.documentId,
        updatedData: getUpdateData(extraValue, true),
      });
    }
  } else {
    // Создаём новый приход
    await createIncome({
      count: extraValue,
      income_category: "Оплата за ремонт",
      note: "Автосоздание (доплата)",
      order: orderDocumentId,
      user: currentUserId,
      author: currentUserName,
      isApproved: isAdmin,
    });
  }
};

// Схема валидации
const schema = z
  .object({
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
    total_cost: z
      .string()
      .refine((v) => /^\d+(\.\d+)?$/.test(v), {
        message: "Введите только число",
      })
      .refine((v) => Number(v) >= 0, {
        message: "Сумма не может быть отрицательной",
      }),
    prepay: z
      .string()
      .refine((v) => /^\d+(\.\d+)?$/.test(v), {
        message: "Введите только число",
      })
      .refine((v) => Number(v) >= 0, {
        message: "Сумма не может быть отрицательной",
      }),
    equipment: z.string().optional(),
    completed_work: z.string().optional(),
    note: z.string().optional(),
    add_address: z.string(),
    legal_status: z.string().optional(),
    add_phone: z.string(),
    isNeedReceipt: z.boolean().optional(),
    refusal_comment: z.string().optional(),
    totalCostNoAccounting: z.string().optional(),
  })
  .superRefine((data, ctx) => {
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
      // 🆕 проверка комментария
      if (!data.refusal_comment?.trim()) {
        ctx.addIssue({
          path: ["refusal_comment"],
          code: z.ZodIssueCode.custom,
          message: "Укажите комментарий к причине отказа",
        });
      }
    }

    if (NEED_DEADLINE.has(data.orderStatus) && !data.deadline) {
      ctx.addIssue({
        path: ["deadline"],
        code: z.ZodIssueCode.custom,
        message: "Укажите дедлайн",
      });
    }

    // Проверка что оба поля заполнены
    if (!data.total_cost || !data.prepay) {
      ctx.addIssue({
        path: ["total_cost"],
        code: z.ZodIssueCode.custom,
        message: "Укажите общую сумму и предоплату",
      });
      ctx.addIssue({
        path: ["prepay"],
        code: z.ZodIssueCode.custom,
        message: "Укажите общую сумму и предоплату",
      });
    }

    // Проверка что общая сумма >= предоплаты
    const total = Number(data.total_cost || 0);
    const prepay = Number(data.prepay || 0);
    if (total < prepay) {
      ctx.addIssue({
        path: ["total_cost"],
        code: z.ZodIssueCode.custom,
        message: "Общая сумма не может быть меньше предоплаты",
      });
    }
  });

type FormData = z.infer<typeof schema>;

interface Props {
  data?: OrderProps | null;
  clientDocumentId?: string;
  masterId?: string;
  onDirtyChange?: (dirty: boolean) => void; // ← добавили
}

export function RepairOrderForm({
  data,
  clientDocumentId,
  masterId,
  onDirtyChange,
}: Props) {
  const router = useRouter();
  const isNew = !data;
  const { settings } = useSettings();
  const { updateOrder, createOrder } = useOrders(1, 1);
  const { user, roleId } = useAuth();
  const queryClient = useQueryClient();

  // Фильтр для получения доходов по заказу
  const incomeFilter = data?.documentId
    ? { order: { documentId: { $eq: data.documentId } } }
    : undefined;

  const {
    createIncome,
    updateIncome,
    incomes: orderIncomes,
  } = useIncomes(1, 50, incomeFilter);

  const visitDate = data?.visit_date ? parseISO(data.visit_date) : undefined;
  const visitTime = visitDate
    ? `${visitDate.getHours().toString().padStart(2, "0")}:${visitDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}`
    : "";

  const toStrapiDate = (d?: Date) => (d ? format(d, "yyyy-MM-dd") : undefined);
  const fromStrapiDate = (s?: string) =>
    s ? new Date(`${s}T00:00:00`) : undefined;

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
      deadline: data?.deadline ? fromStrapiDate(data.deadline) : undefined,
      device_type: data?.device_type || "",
      brand: data?.brand || "",
      model: data?.model || "",
      serial_number: data?.serial_number || "",
      reason_for_refusal: data?.reason_for_refusal || "",
      defect: data?.defect || "",
      conclusion: data?.conclusion || "",
      total_cost: data?.total_cost || "0",
      prepay: data?.prepay || "0",
      equipment: data?.equipment || "",
      completed_work: data?.completed_work || "",
      note: data?.note || "",
      add_address: data?.add_address || "",
      add_phone: data?.add_phone || "",
      isNeedReceipt: data?.isNeedReceipt || false,
      legal_status: data?.legal_status || "",
      totalCostNoAccounting: data?.totalCostNoAccounting || "",
    },
  });

  const status = form.watch("orderStatus");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    if (countdown === 0 && createdId) {
      router.push(`/orders/${createdId}`);
    }
  }, [countdown, createdId, router]);

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

  const onSubmit = async (value: FormData) => {
    setIsSubmitting(true);
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
      is_approve: roleId === 3 ? true : data?.is_approve,
    };

    delete payload.visit_time;

    try {
      if (isNew) {
        setIsSubmitting(true);
        const created = await createOrder({
          ...payload,
          client: clientDocumentId ? clientDocumentId : undefined,
          master: masterId ? +masterId : undefined,
          author: user?.name,
        });
        setCreatedId(created.documentId);
        toast("Заказ создан", {
          action: {
            label: "Перейти",
            onClick: () => router.push(`/orders/${created.documentId}`),
          },
        });
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev === 1) clearInterval(timer);
            return prev - 1;
          });
        }, 1000);
        form.reset(form.getValues());
        return;
      }

      // 🔹 Апдейт существующего заказа
      delete (payload as any).master;
      delete (payload as any).client;

      const numericId =
        (data as any)?.id ??
        Number((data?.title ?? "").match(/\d+$/)?.[0]) ??
        undefined;

      const prefix = getPrefixByKind(payload.kind_of_repair);
      const expectedTitle = numericId ? `${prefix}-${numericId}` : undefined;

      if (expectedTitle && data?.title !== expectedTitle) {
        (payload as any).title = expectedTitle;
      }

      await updateOrder({
        documentId: data!.documentId,
        updatedData: payload,
      });

      // 💰 Синхронизация приходов — ВСЕГДА при сохранении заказа
      await syncOrderIncomes({
        orderDocumentId: data!.documentId,
        prepayValue: Number(value.prepay || 0),
        totalCostValue: Number(value.total_cost || 0),
        currentIncomes: orderIncomes,
        currentUserId: user?.id,
        currentUserName: user?.name,
        isAdmin: roleId === 3,
        createIncome,
        updateIncome,
      });

      form.reset(form.getValues());
      toast.success("Заказ и приходы обновлены");

      // Инвалидируем кэш доходов чтобы получить актуальные данные
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при сохранении");
    } finally {
      setIsSubmitting(false);

      setTimeout(() => {
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) && query.queryKey[0] === "order",
        });
      }, 1000);
    }
  };

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
                  {field.value
                    ? format(field.value.toString(), "dd.MM.yyyy")
                    : "Выберите дату"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value as Date}
                onSelect={field.onChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </FormItem>
      )}
    />
  );

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="add_phone"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Доп. телефон клиента</FormLabel>
                  <FormControl>
                    <Input
                      mask="+0 000 000 00-00"
                      disabled={roleId === 1}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="add_address"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Доп. адрес клиента</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
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
            {/* ⚖️ Статус юридического дела */}
            {status === "Юридический отдел" && (
              <FormField
                name="legal_status"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус юр. дела</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(val) =>
                        form.setValue("legal_status", val)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите статус дела" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEGAL_STATUSES.map((item) => (
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
            )}
            <FormField
              name="warranty"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Гарантия</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="source"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Источник</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите источник лида" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings?.orderSources.map((item) => (
                        <SelectItem key={item.id} value={item.title}>
                          {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            {status === "Отказ" && (
              <>
                <FormField
                  name="reason_for_refusal"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Причина отказа</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Выберите причину отказа " />
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
                  )}
                />
                <FormField
                  name="refusal_comment"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Комментарий к причине отказа</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="Например: клиент отказался из-за высокой стоимости ремонта"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <FormField
              name="type_of_repair"
              control={form.control}
              render={({ field }) => (
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
              )}
            />
            <FormField
              name="kind_of_repair"
              control={form.control}
              render={({ field }) => (
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
              )}
            />
            <FormField
              name="isNeedReceipt"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex gap-4 items-end mb-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">
                    Необходимо пробить чек
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Дата выезда */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                {renderDateField("visit_date", "Дата выезда")}
              </div>
              <FormField
                name="visit_time"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Время выезда</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            {renderDateField("diagnostic_date", "Дата диагностики")}
            {renderDateField("date_of_issue", "Дата выдачи")}
            {renderDateField("deadline", "Дедлайн")}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <FormField
              name="device_type"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип устройства</FormLabel>
                  <ShadcnPopover open={open} onOpenChange={setOpen}>
                    <ShadcnPopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
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
                            <CommandItem
                              key={device.id}
                              value={device.title}
                              onSelect={() => {
                                form.setValue("device_type", device.title);
                                setOpen(false);
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  device.title === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {device.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </ShadcnPopoverContent>
                  </ShadcnPopover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="brand"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Производитель</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="model"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Модель</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="serial_number"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Серийный номер</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <FormField
              name="equipment"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комплектация</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="defect"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Неисправность</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="conclusion"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заключение</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="completed_work"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Выполненные работы</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <FormField
              name="total_cost"
              control={form.control}
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Общая стоимость</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="prepay"
              control={form.control}
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Предоплата</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="totalCostNoAccounting"
              control={form.control}
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Общая стоимость (без доб. в расчеты)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div>
            <FormField
              name="note"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Примечание</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                "Сохранить"
              )}
            </Button>
            {isSubmitting && createdId && (
              <>
                <span className="text-muted-foreground">
                  Переход через {countdown} сек
                </span>
                <Button type="button" variant="secondary" asChild>
                  <Link href={`/orders/${createdId}`}>Перейти сейчас</Link>
                </Button>
              </>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
