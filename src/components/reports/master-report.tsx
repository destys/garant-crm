"use client";

import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { Check, ChevronsUpDown, Loader2Icon, PrinterCheckIcon } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import qs from "qs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUsers } from "@/hooks/use-users";
import { useOrders } from "@/hooks/use-orders";
import { useIncomes } from "@/hooks/use-incomes";
import { useAuth } from "@/providers/auth-provider";
import { fetchOrders } from "@/services/orders-service";
import { fetchIncomes } from "@/services/incomes-service";
import { generateMasterReportPdf } from "@/lib/pdf/generate-master-report";
import { OrderProps } from "@/types/order.types";
import { UserProps } from "@/types/user.types";
import { IncomeOutcomeProps } from "@/types/income-outcome.types";

interface Props {
  range?: DateRange;
}

const PAGE_SIZE = 100;

export const MasterReport = ({ range }: Props) => {
  const [open, setOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<string | null>(null);

  const { users } = useUsers(1, 50);
  const { jwt: token } = useAuth();

  // ---------- Filters ----------
  const orderFilters = useMemo(() => {
    if (!range?.from || !range?.to || !selected) return undefined;
    return {
      $and: [
        { createdAt: { $gte: range.from } },
        { createdAt: { $lte: range.to } },
        { master: { id: { $eq: Number(selected) } } },
      ],
    };
  }, [range, selected]);

  const accountingFilters = useMemo(() => {
    if (!range?.from || !range?.to || !selected) return undefined;
    return {
      $and: [
        { user: { id: { $eq: Number(selected) } } },
        {
          $or: [
            {
              $and: [
                { createdDate: { $gte: range.from } },
                { createdDate: { $lte: range.to } },
              ],
            },
            {
              $and: [
                { createdDate: { $null: true } },
                { createdAt: { $gte: range.from } },
                { createdAt: { $lte: range.to } },
              ],
            },
          ],
        },
      ],
    };
  }, [range, selected]);

  // ---------- Data ----------
  const {
    data: firstOrders = [],
    total: ordersTotal = 0,
    isLoading: ordersLoading,
  } = useOrders(1, PAGE_SIZE, orderFilters);

  const {
    incomes: firstIncomes = [],
    total: incomesTotal = 0,
    isLoading: incomesLoading,
  } = useIncomes(1, PAGE_SIZE, accountingFilters);

  const ordersPageCount = Math.ceil(ordersTotal / PAGE_SIZE);
  const incomesPageCount = Math.ceil(incomesTotal / PAGE_SIZE);

  const ordersQueryString = useMemo(
    () =>
      qs.stringify(
        { filters: orderFilters, sort: ["createdAt:desc"] },
        { encodeValuesOnly: true }
      ),
    [orderFilters]
  );

  const incomesQueryString = useMemo(
    () =>
      qs.stringify({ filters: accountingFilters }, { encodeValuesOnly: true }),
    [accountingFilters]
  );

  // ---------- Pagination ----------
  const otherOrdersQueries = useQueries({
    queries:
      selected && ordersPageCount > 1
        ? Array.from({ length: ordersPageCount - 1 }, (_, i) => {
            const page = i + 2;
            return {
              queryKey: ["orders", page, PAGE_SIZE, orderFilters],
              queryFn: () =>
                fetchOrders(token ?? "", page, PAGE_SIZE, ordersQueryString),
              enabled: !!token && !!orderFilters && ordersTotal > PAGE_SIZE,
              staleTime: 60_000,
            };
          })
        : [],
  });

  const otherIncomesQueries = useQueries({
    queries:
      selected && incomesPageCount > 1
        ? Array.from({ length: incomesPageCount - 1 }, (_, i) => {
            const page = i + 2;
            return {
              queryKey: ["incomes", page, PAGE_SIZE, accountingFilters],
              queryFn: () =>
                fetchIncomes(token ?? "", page, PAGE_SIZE, incomesQueryString),
              enabled:
                !!token && !!accountingFilters && incomesTotal > PAGE_SIZE,
              staleTime: 60_000,
            };
          })
        : [],
  });

  // ---------- Combine ----------
  const allOrders: OrderProps[] = useMemo(() => {
    const rest = otherOrdersQueries.flatMap((q) => q.data?.orders ?? []);
    return [...firstOrders, ...rest];
  }, [firstOrders, otherOrdersQueries]);

  const allIncomes: IncomeOutcomeProps[] = useMemo(() => {
    const rest = otherIncomesQueries.flatMap((q) => q.data?.incomes ?? []);
    return [...firstIncomes, ...rest];
  }, [firstIncomes, otherIncomesQueries]);

  const isLoading =
    ordersLoading ||
    incomesLoading ||
    otherOrdersQueries.some((q) => q.isLoading) ||
    otherIncomesQueries.some((q) => q.isLoading);

  // ---------- Statistics ----------
  const openCount = allOrders.filter((o) =>
    [
      "Новая",
      "Согласовать",
      "Отремонтировать",
      "Купить запчасти",
      "Отправить курьера",
    ].includes(o.orderStatus)
  ).length;

  const completedCount = allOrders.filter(
    (o) => o.orderStatus === "Выдан" && o.is_approve === true
  ).length;

  const rejectedCount = allOrders.filter(
    (o) => o.orderStatus === "Отказ" && o.is_approve === true
  ).length;

  const totalIncome = allIncomes.reduce<number>(
    (acc, curr) => acc + (curr.count || 0),
    0
  );

  const statCards: { title: string; value: string | number }[] = [
    { title: "Открытые", value: openCount },
    { title: "Завершено", value: completedCount },
    { title: "Отказов", value: rejectedCount },
    { title: "Доход", value: `${totalIncome} ₽` },
  ];

  const selectedUser: UserProps | undefined = users.find(
    (m) => m.id.toString() === selected
  );

  // ---------- Render ----------
  return (
    <Card>
      <CardHeader>
        <CardTitle>Статистика по сотруднику</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4">
          {/* Выбор сотрудника */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedUser ? selectedUser.name : "Выберите сотрудника"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Поиск сотрудника..." />
                <CommandEmpty>Не найдено</CommandEmpty>
                <CommandGroup>
                  {users.map((m) => (
                    <CommandItem
                      key={m.id}
                      value={m.id.toString()}
                      onSelect={(value) => {
                        setSelected(value === selected ? null : value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected === m.id.toString()
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {m.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="max-lg:hidden" />

          {/* Кнопка */}
          <Button
            disabled={!selected || !range?.from || isLoading}
            onClick={() =>
              generateMasterReportPdf(
                allOrders,
                range?.from,
                range?.to,
                selectedUser?.name || "Имя не заполнено",
                { mode: "download" }
              )
            }
          >
            <PrinterCheckIcon className="mr-2 h-4 w-4" />
            Скачать отчет в PDF
          </Button>
        </div>

        {/* Карточки */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map((stat, i) => (
            <Card key={i} className="flex flex-col max-sm:py-3">
              <CardHeader className="max-sm:px-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-lg sm:text-2xl font-bold max-sm:px-3">
                {!selected ? (
                  "—"
                ) : isLoading ? (
                  <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  stat.value
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
