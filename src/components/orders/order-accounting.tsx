"use client";

import React from "react";
import {
  CheckCheckIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
} from "@/components/ui/table";
import { cn, formatDate } from "@/lib/utils";
import { OrderProps } from "@/types/order.types";
import { IncomeOutcomeProps } from "@/types/income-outcome.types";
import { useModal } from "@/providers/modal-provider";
import { useAuth } from "@/providers/auth-provider";
import { useUsers } from "@/hooks/use-users";
import { useIncomes } from "@/hooks/use-incomes";
import { useOutcomes } from "@/hooks/use-outcomes";

interface Props {
  data: OrderProps;
}

export const OrderAccounting = ({ data }: Props) => {
  const { openModal } = useModal();
  const { roleId } = useAuth();
  const queryClient = useQueryClient();

  const { updateBalanceAtomic } = useUsers(1, 100);
  const { updateIncome, deleteIncome } = useIncomes(1, 100);
  const { updateOutcome, deleteOutcome } = useOutcomes(1, 100);

  // задержанная инвалидация после изменений
  const delayedInvalidate = () => {
    setTimeout(() => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === "order",
      });
    }, 1000);
  };

  const renderTable = (
    items: IncomeOutcomeProps[],
    type: "incomes" | "expenses"
  ) => (
    <>
      {/* Стандартная таблица для ≥768px */}
      <div className="w-full overflow-x-auto hidden md:block">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Дата</TableHead>
              <TableHead className="whitespace-nowrap">Описание</TableHead>
              <TableHead className="whitespace-nowrap">Сотрудник</TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Сумма
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Действия
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length > 0 ? (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {formatDate(item.createdDate, "dd.MM.yy HH:mm")}
                  </TableCell>
                  <TableCell>{item.note}</TableCell>
                  <TableCell>{item.user?.name || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={type === "incomes" ? "default" : "destructive"}
                      className={cn(type === "incomes" && "bg-green-500")}
                    >
                      {item.count.toLocaleString()} ₽
                    </Badge>
                  </TableCell>
                  {/* ЭКШЕНЫ */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {roleId === 3 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            openModal("incomeOutcome", {
                              title:
                                type === "incomes"
                                  ? "Редактировать приход"
                                  : "Редактировать расход",
                              props: {
                                type: type === "incomes" ? "income" : "outcome",
                                item,
                                isEdit: true,
                              },
                            })
                          }
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                      )}
                      {roleId === 3 &&
                        (item.isApproved ? (
                          <Button size="icon" disabled>
                            <CheckCheckIcon className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="default"
                            className="bg-green-500"
                            onClick={async () => {
                              const confirmApprove = confirm("Подтвердить запись?");
                              if (!confirmApprove) return;
                              try {
                                if (type === "expenses") {
                                  await updateOutcome({
                                    documentId: item.documentId,
                                    updatedData: { isApproved: true },
                                  });
                                  if (
                                    item.user?.id &&
                                    item.outcome_category ===
                                      "Зарплата сотрудников"
                                  ) {
                                    await updateBalanceAtomic({
                                      userId: item.user.id,
                                      delta: item.count,
                                    });
                                  }
                                }
                                if (type === "incomes") {
                                  await updateIncome({
                                    documentId: item.documentId,
                                    updatedData: { isApproved: true },
                                  });
                                }
                                delayedInvalidate();
                              } catch (err) {
                                console.error("Ошибка при подтверждении:", err);
                              }
                            }}
                          >
                            <CheckIcon className="w-4 h-4" />
                          </Button>
                        ))}
                      {roleId === 3 && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={async () => {
                            const confirmDelete = confirm("Удалить эту запись?");
                            if (!confirmDelete) return;
                            try {
                              const {
                                isApproved,
                                user,
                                outcome_category,
                                count,
                                documentId,
                              } = item;
                              if (type === "incomes") {
                                await deleteIncome(documentId);
                              }
                              if (type === "expenses") {
                                if (
                                  isApproved &&
                                  user?.id &&
                                  outcome_category === "Зарплата сотрудников"
                                ) {
                                  await updateBalanceAtomic({
                                    userId: user.id,
                                    delta: -count,
                                  });
                                }
                                await deleteOutcome(documentId);
                              }
                              delayedInvalidate();
                            } catch (err) {
                              console.error("Ошибка при удалении:", err);
                            }
                          }}
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-6"
                >
                  Нет данных
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Мобильные карточки для <768px */}
      <div className="block md:hidden">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="border rounded-lg mb-4 p-3">
              <div className="p-1 border-b">
                <strong>Дата:</strong>{" "}
                {formatDate(item.createdDate, "dd.MM.yy HH:mm")}
              </div>
              {item.note && (
                <div className="p-1 border-b">
                  <strong>Описание:</strong> {item.note}
                </div>
              )}
              <div className="p-1 border-b">
                <strong>Сотрудник:</strong> {item.user?.name || "—"}
              </div>
              <div className="p-1 border-b">
                <strong>Сумма:</strong>{" "}
                <Badge
                  variant={type === "incomes" ? "default" : "destructive"}
                  className={cn(type === "incomes" && "bg-green-500")}
                >
                  {item.count.toLocaleString()} ₽
                </Badge>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                {/* экшены (редактирование, подтверждение, удаление) */}
                {roleId === 3 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      openModal("incomeOutcome", {
                        title:
                          type === "incomes"
                            ? "Редактировать приход"
                            : "Редактировать расход",
                        props: {
                          type: type === "incomes" ? "income" : "outcome",
                          item,
                          isEdit: true,
                        },
                      })
                    }
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                )}
                {roleId === 3 &&
                  (item.isApproved ? (
                    <Button size="icon" disabled>
                      <CheckCheckIcon className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="default"
                      className="bg-green-500"
                      onClick={async () => {
                        const confirmApprove = confirm("Подтвердить запись?");
                        if (!confirmApprove) return;
                        try {
                          if (type === "expenses") {
                            await updateOutcome({
                              documentId: item.documentId,
                              updatedData: { isApproved: true },
                            });
                            if (
                              item.user?.id &&
                              item.outcome_category === "Зарплата сотрудников"
                            ) {
                              await updateBalanceAtomic({
                                userId: item.user.id,
                                delta: item.count,
                              });
                            }
                          }
                          if (type === "incomes") {
                            await updateIncome({
                              documentId: item.documentId,
                              updatedData: { isApproved: true },
                            });
                          }
                          delayedInvalidate();
                        } catch (err) {
                          console.error("Ошибка при подтверждении:", err);
                        }
                      }}
                    >
                      <CheckIcon className="w-4 h-4" />
                    </Button>
                  ))}
                {roleId === 3 && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={async () => {
                      const confirmDelete = confirm("Удалить эту запись?");
                      if (!confirmDelete) return;
                      try {
                        const {
                          isApproved,
                          user,
                          outcome_category,
                          count,
                          documentId,
                        } = item;
                        if (type === "incomes") {
                          await deleteIncome(documentId);
                        }
                        if (type === "expenses") {
                          if (
                            isApproved &&
                            user?.id &&
                            outcome_category === "Зарплата сотрудников"
                          ) {
                            await updateBalanceAtomic({
                              userId: user.id,
                              delta: -count,
                            });
                          }
                          await deleteOutcome(documentId);
                        }
                        delayedInvalidate();
                      } catch (err) {
                        console.error("Ошибка при удалении:", err);
                      }
                    }}
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-6">
            Нет данных
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="grid gap-6 mt-6 grid-cols-1">
      {/* Приходы */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg">Приходы</CardTitle>
          <Button
            size="sm"
            variant="default"
            className="w-full sm:w-auto"
            onClick={() =>
              openModal("incomeOutcome", {
                title: "Добавить приход",
                props: {
                  type: "income",
                  orderId: data.documentId,
                  masterId: roleId === 1 ? data.master?.id : null,
                },
              })
            }
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            <span>Добавить приход</span>
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          {renderTable(data.incomes, "incomes")}
        </CardContent>
      </Card>

      {/* Расходы */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg">Расходы</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() =>
              openModal("incomeOutcome", {
                title: "Добавить расход",
                props: {
                  type: "outcome",
                  orderId: data.documentId,
                  masterId: roleId === 1 ? data.master?.id : null,
                },
              })
            }
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            <span>Добавить расход</span>
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          {renderTable(data.outcomes, "expenses")}
        </CardContent>
      </Card>
    </div>
  );
};
