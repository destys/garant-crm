"use strict";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  IncomeOutcomeProps,
  UpdateIncomeOutcomeDto,
} from "@/types/income-outcome.types";
import {
  fetchOutcomes,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/services/outcomes-service";
import { useAuth } from "@/providers/auth-provider";

export const useOutcomes = (page: number, pageSize: number, query?: string) => {
  const { jwt } = useAuth();
  const queryClient = useQueryClient();
  const authToken = jwt ?? "";

  const outcomesQuery = useQuery<{
    outcomes: IncomeOutcomeProps[];
    total: number;
  }>({
    queryKey: ["outcomes", page, pageSize, query],
    queryFn: () => fetchOutcomes(authToken, page, pageSize, query),
    enabled: !!jwt,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<UpdateIncomeOutcomeDto>) =>
      createExpense(authToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outcomes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      documentId,
      updatedData,
    }: {
      documentId: string;
      updatedData: Partial<IncomeOutcomeProps>;
    }) => updateExpense(authToken, documentId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outcomes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteExpense(authToken, documentId),
    onSuccess: (_, documentId) => {
      queryClient.setQueryData<{
        outcomes: IncomeOutcomeProps[];
        total: number;
      }>(["outcomes"], (oldData) => {
        if (!oldData) return { outcomes: [], total: 0 };
        return {
          outcomes: oldData.outcomes.filter(
            (item) => item.documentId !== documentId
          ),
          total: oldData.total - 1,
        };
      });
      queryClient.invalidateQueries({ queryKey: ["outcomes"] });
    },
  });

  return {
    outcomes: outcomesQuery.data?.outcomes || [],
    total: outcomesQuery.data?.total || 0,
    isLoading: outcomesQuery.isLoading,
    isError: outcomesQuery.isError,
    error: outcomesQuery.error,
    createOutcome: createMutation.mutate,
    updateOutcome: updateMutation.mutate,
    deleteOutcome: deleteMutation.mutate,
  };
};
