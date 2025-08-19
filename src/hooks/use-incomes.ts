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
  sort?: unknown
) => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? "";

  const queryString = QueryString.stringify(
    { filters: query, sort: sort },
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

  const createMutation = useMutation({
    mutationFn: (data: Partial<UpdateIncomeOutcomeDto>) =>
      createIncome(authToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
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
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"], exact: false });
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
