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
    { filters: query, sort: sort, pagination: pagination },
    { encodeValuesOnly: true }
  );

  const incomesQuery = useQuery<{
    incomes: IncomeOutcomeProps[];
    total: number;
  }>({
    queryKey: ["incomes", page, pageSize, query],
    queryFn: () => fetchIncomes(authToken, page, pageSize, queryString),
    enabled: !!token,
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
    isLoading: incomesQuery.isLoading,
    isError: incomesQuery.isError,
    error: incomesQuery.error,
    createIncome: createMutation.mutate,
    updateIncome: updateMutation.mutate,
    deleteIncome: deleteMutation.mutate,
  };
};

export const useIncomesAll = (query?: unknown) => {
  const { jwt } = useAuth();
  const authToken = jwt ?? "";
  const pageSize = 100;
  const maxPages = 50;
  const sort = ["createdAt:desc"];

  const queryString = QueryString.stringify(
    { filters: query, sort },
    { encodeValuesOnly: true }
  );

  return useQuery({
    queryKey: ["incomes-all", query],
    enabled: !!jwt,
    queryFn: async () => {
      const requests = Array.from({ length: maxPages }, (_, i) =>
        fetchIncomes(authToken, i + 1, pageSize, queryString)
      );
      const results = await Promise.all(requests);
      const allIncomes = results.flatMap((r) => r.incomes);
      return allIncomes;
    },
    staleTime: 0, // сразу будет инвалидироваться после мутаций
    gcTime: 1000 * 60 * 10,
  });
};
