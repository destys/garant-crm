"use strict";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import QueryString from "qs";

import { useAuth } from "@/providers/auth-provider";
import {
  fetchIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
} from "@/services/incomes-service";
import {
  IncomeOutcomeProps,
  UpdateIncomeOutcomeDto,
} from "@/types/income-outcome.types";

export const useIncomes = (
  page: number,
  pageSize: number,
  query?: unknown,
  sort?: unknown,
  pagination?: unknown
) => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? "";

  const queryString = QueryString.stringify(
    { filters: query, sort: sort ? sort : ["createdAt:desc"], pagination: pagination },
    { encodeValuesOnly: true }
  );

  const incomesQuery = useQuery<{
    incomes: IncomeOutcomeProps[];
    total: number;
    pageCount: number;
  }>({
    queryKey: ["incomes", page, pageSize, query],
    queryFn: async () => {
      const result = await fetchIncomes(authToken, page, pageSize, queryString);
      return {
        ...result,
        pageCount: Math.ceil(result.total / pageSize),
      };
    },
    enabled: !!token,
    staleTime: 1000 * 30,
  });

  // 🔹 Мутации с инвалидацией всех связанных запросов
  const createMutation = useMutation({
    mutationFn: (data: Partial<UpdateIncomeOutcomeDto>) =>
      createIncome(authToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["incomes-all"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      documentId,
      updatedData,
    }: {
      documentId: string;
      updatedData: Partial<IncomeOutcomeProps>;
    }) => updateIncome(authToken, documentId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["incomes-all"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteIncome(authToken, documentId),
    onSuccess: (_, documentId) => {
      queryClient.setQueryData<{
        incomes: IncomeOutcomeProps[];
        total: number;
      }>(["incomes"], (oldData) => {
        if (!oldData) return { incomes: [], total: 0 };
        return {
          incomes: oldData.incomes.filter(
            (item) => item.documentId !== documentId
          ),
          total: oldData.total - 1,
        };
      });
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["incomes-all"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"], exact: false });
      queryClient.invalidateQueries({
        queryKey: ["incomes-all"],
        exact: false,
      });
    },
  });

  return {
    incomes: incomesQuery.data?.incomes || [],
    total: incomesQuery.data?.total || 0,
    pageCount: incomesQuery.data?.pageCount || 1,
    isLoading: incomesQuery.isLoading,
    isFetching: incomesQuery.isFetching,
    isError: incomesQuery.isError,
    error: incomesQuery.error,
    createIncome: createMutation.mutate,
    updateIncome: updateMutation.mutate,
    deleteIncome: deleteMutation.mutate,
  };
};

/**
 * Оптимизированный хук для загрузки всех incomes.
 * Сначала загружает первую страницу чтобы узнать total,
 * затем параллельно загружает только нужные страницы.
 */
export const useIncomesAll = (query?: unknown) => {
  const { jwt } = useAuth();
  const authToken = jwt ?? "";
  const pageSize = 100;
  const sort = ["createdAt:desc"];

  const queryString = QueryString.stringify(
    { filters: query, sort },
    { encodeValuesOnly: true }
  );

  return useQuery({
    queryKey: ["incomes-all", query],
    enabled: !!jwt,
    queryFn: async () => {
      // Сначала получаем первую страницу чтобы узнать total
      const firstPage = await fetchIncomes(authToken, 1, pageSize, queryString);
      const total = firstPage.total;

      // Если все данные на первой странице — возвращаем сразу
      if (total <= pageSize) {
        return firstPage.incomes;
      }

      // Вычисляем сколько страниц нужно загрузить
      const totalPages = Math.ceil(total / pageSize);
      const remainingPages = Math.min(totalPages - 1, 49); // максимум 50 страниц

      // Загружаем остальные страницы параллельно
      const requests = Array.from({ length: remainingPages }, (_, i) =>
        fetchIncomes(authToken, i + 2, pageSize, queryString)
      );
      const results = await Promise.all(requests);

      // Объединяем результаты
      return [firstPage.incomes, ...results.map((r) => r.incomes)].flat();
    },
    staleTime: 1000 * 60 * 2, // 2 минуты — данные не устареют сразу
    gcTime: 1000 * 60 * 10,
  });
};
