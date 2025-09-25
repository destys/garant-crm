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

const incomeSchema = z.object({
  count: z.string(),
  note: z.string().optional(),
  master: z.string(),
  income_category: z.string().min(1, "Выберите статью расходов"),
});
type IncomeValues = z.infer<typeof incomeSchema>;

const outcomeSchema = z.object({
  count: z.string(),
  master: z.string(),
  note: z.string().optional(),
  outcome_category: z.string().min(1, "Выберите статью расходов"),
});
type OutcomeValues = z.infer<typeof outcomeSchema>;

interface Props {
  close: () => void;
  props?: {
    type: "income" | "outcome";
    orderId: string;
    masterId: number;
  };
}

const SALARY_LABEL = "Зарплата сотрудников";

export const AddIncomeOutcomeModal = ({ close, props }: Props) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { createIncome } = useIncomes(1, 1);
  const { createOutcome } = useOutcomes(1, 1);
  const { users, updateUser } = useUsers(1, 100);
  const { user, roleId, jwt } = useAuth();
  const [photo, setPhoto] = useState<MediaProps | null>(null);
  const { settings } = useSettings();

  // Определим форму и схему в зависимости от типа
  const isOutcome = props?.type === "outcome";

  const form = useForm<IncomeValues | OutcomeValues>({
    resolver: zodResolver(isOutcome ? outcomeSchema : incomeSchema),
    defaultValues: {
      count: "0",
      note: "",
      outcome_category: "", // безопасно, даже если не используется
    } as any,
  });

  const onSubmit = async (values: IncomeValues | OutcomeValues) => {
    try {
      setLoading(true);
      const payload: Record<string, any> = {
        count: +values.count,
        note: values.note,
        order: props?.orderId,
        user: props?.masterId ? props?.masterId : values.master,
        author: user?.name,
        isApproved: roleId === 3,
      };

      if (photo?.id) {
        payload.photo = photo.id; // в Strapi — одиночное медиа поле "photo"
      }

      if (isOutcome) {
        payload.outcome_category = (values as OutcomeValues).outcome_category;
        await createOutcome(payload);

        if (payload.outcome_category === SALARY_LABEL) {
          const userObj = users.find((u) => u.id === +payload.user);
          const currentBalance = userObj?.balance || 0;
          const countNum = Number(payload.count);

          const newBalance = currentBalance + countNum;

          const updatedData = {
            balance: roleId === 3 ? newBalance : currentBalance,
          };

          updateUser({
            userId: payload.user,
            updatedData: updatedData,
          });
          toast.success("Зарплата добавлена");
        } else {
          toast.success("Расход добавлен");
        }
        toast.success("Расход добавлен");
      } else {
        payload.income_category = (values as IncomeValues).income_category;
        await createIncome(payload);
        toast.success("Доход добавлен");
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
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);

                        // Если note пустой — запишем туда выбранную категорию
                        const note = form.getValues("note");
                        if (!note?.trim()) {
                          form.setValue("note", value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите статью" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings?.outcome_categories.map((item) => (
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
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);

                        // Если note пустой — запишем туда выбранную категорию
                        const note = form.getValues("note");
                        if (!note?.trim()) {
                          form.setValue("note", value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите статью" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings?.income_categories.map((item) => (
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
