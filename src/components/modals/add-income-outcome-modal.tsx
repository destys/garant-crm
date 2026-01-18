/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { CheckIcon, ChevronsUpDown, Loader2Icon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import z from "zod";
import { FilePond } from "react-filepond";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { useIncomes } from "@/hooks/use-incomes";
import { useOutcomes } from "@/hooks/use-outcomes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_URL } from "@/constants";
import { useUsers } from "@/hooks/use-users";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { MediaProps } from "@/types/media.types";
import { useSettings } from "@/hooks/use-settings";
import { Calendar } from "@/components/ui/calendar";

import "filepond/dist/filepond.min.css";

const incomeSchema = z.object({
  count: z.string(),
  note: z.string().optional(),
  master: z.string(),
  income_category: z.string().min(1, "Выберите статью расходов"),
  createdDateDate: z.string(),
  createdDateTime: z.string(),
});
type IncomeValues = z.infer<typeof incomeSchema>;

const outcomeSchema = z.object({
  count: z.string(),
  master: z.string(),
  note: z.string().optional(),
  outcome_category: z.string().min(1, "Выберите статью расходов"),
  createdDateDate: z.string(),
  createdDateTime: z.string(),
});
type OutcomeValues = z.infer<typeof outcomeSchema>;

interface Props {
  close: () => void;
  props?: {
    type: "income" | "outcome";
    orderId: string;
    masterId: number;
    item?: any;
    isEdit?: boolean;
  };
}

const SALARY_LABEL = "Зарплата сотрудников";

export const AddIncomeOutcomeModal = ({ close, props }: Props) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { createIncome, updateIncome } = useIncomes(1, 1);
  const { createOutcome, updateOutcome } = useOutcomes(1, 1);
  const { users, updateBalanceAtomic } = useUsers(1, 100);
  const { user, roleId, jwt } = useAuth();
  const [photo, setPhoto] = useState<MediaProps | null>(null);
  const { settings } = useSettings();

  // Проверка, что все необходимые данные загружены
  const isDataLoading = !settings || !users || !props || !props.type;

  // Формируем defaultValues синхронно
  let defaultValues: any = {};
  const isOutcome = props?.type === "outcome";
  const now = new Date();
  const defaultDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const defaultTime = now.toTimeString().slice(0, 5); // HH:MM

  if (!isDataLoading) {
    // Если редактирование, заполняем из item
    if (props?.isEdit && props.item) {
      const item = props.item;
      let dateObj;
      if (item.createdDate) {
        dateObj = new Date(item.createdDate);
      } else if (item.createdAt) {
        dateObj = new Date(item.createdAt);
      } else {
        dateObj = new Date();
      }
      const dateStr = dateObj.toISOString().slice(0, 10);
      const timeStr = dateObj.toTimeString().slice(0, 5);
      defaultValues = {
        count: String(item.count || 0),
        note: item.note || "",
        master: item.user?.id?.toString() || "",
        income_category: item.income_category || "",
        outcome_category: item.outcome_category || "",
        createdDateDate: dateStr,
        createdDateTime: timeStr,
      };
      // Фото
      if (item.photo && !photo) {
        setPhoto({
          id: item.photo.id,
          name: item.photo.name,
          url: item.photo.url.startsWith("http")
            ? item.photo.url
            : `${API_URL}${item.photo.url}`,
          mime: item.photo.mime,
        });
      }
    } else {
      // Новый документ: текущая дата/время, первая категория если есть
      defaultValues = {
        count: "0",
        note: "",
        master: props?.masterId ? props.masterId.toString() : "",
        income_category: "",
        outcome_category: "",
        createdDateDate: defaultDate,
        createdDateTime: defaultTime,
      };
      // Категория по умолчанию
      if (!isOutcome && settings?.income_categories?.length > 0) {
        defaultValues.income_category = settings.income_categories[0].title;
      }
      if (isOutcome && settings?.outcome_categories?.length > 0) {
        defaultValues.outcome_category = settings.outcome_categories[0].title;
      }
    }
  }

  const form = useForm<IncomeValues | OutcomeValues>({
    resolver: zodResolver(isOutcome ? outcomeSchema : incomeSchema),
    defaultValues,
  });

  const onSubmit = async (values: IncomeValues | OutcomeValues) => {
    try {
      setLoading(true);
      // Собираем дату и время в ISO строку
      let createdDate = "";
      if (values.createdDateDate && values.createdDateTime) {
        // Соберём строку "YYYY-MM-DDTHH:mm"
        createdDate = `${values.createdDateDate}T${values.createdDateTime}:00`;
      } else if (values.createdDateDate) {
        createdDate = `${values.createdDateDate}T00:00:00`;
      } else {
        createdDate = new Date().toISOString();
      }
      const payload: Record<string, any> = {
        count: +values.count,
        note: values.note,
        order: props?.orderId,
        user: props?.masterId ? props?.masterId : values.master,
        author: user?.name,
        isApproved: roleId === 3,
        createdDate: new Date(createdDate).toISOString(),
      };

      if (photo?.id) payload.photo = photo.id; // в Strapi — одиночное медиа поле "photo"

      if (props?.isEdit) {
        // 🔁 Редактирование
        if (props.type === "outcome") {
          payload.outcome_category = (values as OutcomeValues).outcome_category;
          await updateOutcome({
            documentId: props.item.documentId,
            updatedData: payload,
          });
          toast.success("Расход обновлён");
        } else {
          payload.income_category = (values as IncomeValues).income_category;
          await updateIncome({
            documentId: props.item.documentId,
            updatedData: payload,
          });
          toast.success("Приход обновлён");
        }
      } else {
        if (isOutcome) {
          payload.outcome_category = (values as OutcomeValues).outcome_category;
          await createOutcome(payload);

          if (payload.outcome_category === SALARY_LABEL && roleId === 3) {
            const countNum = Number(payload.count);
            // Атомарно обновляем баланс
            await updateBalanceAtomic({
              userId: payload.user,
              delta: countNum,
            });
            toast.success("Зарплата добавлена");
          } else {
            toast.success("Расход добавлен");
          }
        } else {
          payload.income_category = (values as IncomeValues).income_category;
          await createIncome(payload);
          toast.success("Доход добавлен");
        }
      }

      await queryClient.refetchQueries({
        queryKey: ["order", String(props?.orderId)],
        exact: true,
      });

      close();
    } catch (e) {
      console.error("Ошибка создания:", e);
      toast.error("Ошибка создания");
    } finally {
      setLoading(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <Loader2Icon className="animate-spin mb-2 w-8 h-8 text-muted-foreground" />
        <span className="text-muted-foreground text-lg">Загрузка...</span>
      </div>
    );
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Сумма */}
          <FormField
            control={form.control}
            name="count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Сумма</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!props?.masterId && (
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
                        {users.find((m) => m.id.toString() === field.value)
                          ?.name || "Выберите сотрудника"}
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
                                form.setValue("master", val);
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === master.id.toString()
                                    ? "opacity-100"
                                    : "opacity-0"
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

          {/* Статья расходов — только если type === outcome */}
          {isOutcome && (
            <FormField
              control={form.control}
              name="outcome_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Статья расходов</FormLabel>
                  <FormControl>
                    <Select
                      key={`${isOutcome ? "outcome" : "income"}-${
                        settings ? "ready" : "loading"
                      }`}
                      value={field.value || ""}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Если note пустой — запишем туда выбранную категорию
                        const note = form.getValues("note");
                        if (!note?.trim()) {
                          form.setValue("note", value);
                        }
                      }}
                      disabled={
                        !settings?.outcome_categories ||
                        settings.outcome_categories.length === 0
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите статью" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings?.outcome_categories?.map((item) => (
                          <SelectItem key={item.id} value={item.title}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Статья доходов — только если type !== outcome */}
          {!isOutcome && (
            <FormField
              control={form.control}
              name="income_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Статья доходов</FormLabel>
                  <FormControl>
                    <Select
                      key={`${isOutcome ? "outcome" : "income"}-${
                        settings ? "ready" : "loading"
                      }`}
                      value={field.value || ""}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Если note пустой — запишем туда выбранную категорию
                        const note = form.getValues("note");
                        if (!note?.trim()) {
                          form.setValue("note", value);
                        }
                      }}
                      disabled={
                        !settings?.income_categories ||
                        settings.income_categories.length === 0
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите статью" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings?.income_categories?.map((item) => (
                          <SelectItem key={item.id} value={item.title}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="createdDateDate"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Дата</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? format(new Date(field.value), "dd.MM.yyyy", {
                                locale: ru,
                              })
                            : "Выберите дату"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              // date is Date object, set as YYYY-MM-DD
                              field.onChange(date.toISOString().slice(0, 10));
                            }
                          }}
                          showOutsideDays
                          initialFocus
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
              name="createdDateTime"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Время</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Фото (опционально)</FormLabel>
            <FilePond
              allowMultiple={false}
              maxFiles={1}
              acceptedFileTypes={["image/*"]}
              labelIdle='Перетащите фото или <span class="filepond--label-action">выберите</span>'
              onremovefile={() => setPhoto(null)}
              server={{
                process: (
                  fieldName,
                  file,
                  metadata,
                  load,
                  error,
                  progress,
                  abort
                ) => {
                  if (!jwt) {
                    error("Нет токена для загрузки");
                    return { abort() {} };
                  }
                  const formData = new FormData();
                  formData.append("files", file);

                  const xhr = new XMLHttpRequest();
                  xhr.open("POST", `${API_URL}/api/upload`);
                  xhr.setRequestHeader("Authorization", `Bearer ${jwt}`);

                  xhr.upload.onprogress = (e) =>
                    progress(e.lengthComputable, e.loaded, e.total);

                  xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                      try {
                        const uploaded = JSON.parse(xhr.responseText);
                        const f = uploaded?.[0];
                        if (f?.id && f?.url) {
                          setPhoto({
                            id: f.id,
                            name: f.name,
                            url: f.url.startsWith("http")
                              ? f.url
                              : `${API_URL}${f.url}`,
                            mime: f.mime,
                          });
                        }
                        load("done");
                      } catch {
                        error("Ошибка парсинга ответа");
                      }
                    } else {
                      error("Ошибка загрузки файла");
                    }
                  };

                  xhr.onerror = () => error("Ошибка сети");
                  xhr.send(formData);

                  return {
                    abort: () => {
                      xhr.abort();
                      abort();
                    },
                  };
                },
              }}
            />
          </div>

          {/* Комментарий */}
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Комментарий</FormLabel>
                <FormControl>
                  <Textarea placeholder="Комментарий" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Кнопка */}
          <Button type="submit" className="col-span-2" disabled={loading}>
            {loading ? <Loader2Icon className="animate-spin" /> : "Сохранить"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
