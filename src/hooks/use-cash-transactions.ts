import qs from "qs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/providers/auth-provider";
import {
  fetchCashTransactions,
  createCashTransaction,
  updateCashTransaction,
  deleteCashTransaction,
} from "@/services/cash-transactions-service";
import {
  CashboxTransactionProps,
  CashboxTransactionPropsDto,
} from "@/types/cashbox.types";

/**
 * Хук для работы с кассовыми транзакциями (лист, создание, апдейт, удаление)
 */
export const useCashTransactions = (
  page: number,
  pageSize: number,
  query?: unknown,
  sort?: unknown
) => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? "";

  const queryString = qs.stringify(
    { filters: query, sort: sort ? sort : ["createdAt:desc"] },
    { encodeValuesOnly: true }
  );

  // ключ для списка
  const listKey = ["cash-transactions", page, pageSize, query, sort];

  // Список (кэшируем на 30 секунд)
  const listQuery = useQuery<
    { items: CashboxTransactionProps[]; total: number },
    Error
  >({
    queryKey: listKey,
    queryFn: () =>
      fetchCashTransactions(authToken, page, pageSize, queryString),
    enabled: !!token,
    staleTime: 1000 * 30, // 30 секунд
  });

  // Создание
  const createMutation = useMutation({
    mutationFn: (payload: Partial<CashboxTransactionPropsDto>) =>
      createCashTransaction(authToken, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      // при необходимости инвалидация балансов/кассы:
      // queryClient.invalidateQueries({ queryKey: ["cashbox"] });
    },
  });

  // Обновление
  const updateMutation = useMutation({
    mutationFn: ({
      documentId,
      updatedData,
    }: {
      documentId: string;
      updatedData: Partial<CashboxTransactionPropsDto>;
    }) => updateCashTransaction(authToken, documentId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      // queryClient.invalidateQueries({ queryKey: ["cashbox"] });
    },
  });

  // Удаление
  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      deleteCashTransaction(authToken, documentId),
    onMutate: async (documentId: string) => {
      await queryClient.cancelQueries({ queryKey: listKey });

      const previous = queryClient.getQueryData<{
        items: CashboxTransactionProps[];
        total: number;
      }>(listKey);
      if (previous) {
        queryClient.setQueryData(listKey, {
          items: previous.items.filter((i) => i.documentId !== documentId),
          total: Math.max(0, previous.total - 1),
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["cash-transactions"],
        exact: false,
      });
      // queryClient.invalidateQueries({ queryKey: ["cashbox"] });
    },
  });

  return {
    items: listQuery.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,

    createCashTransaction: createMutation.mutateAsync,
    updateCashTransaction: updateMutation.mutateAsync,
    deleteCashTransaction: deleteMutation.mutateAsync,
  };
};
