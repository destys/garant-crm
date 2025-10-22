import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import QueryString from "qs";

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

export const useOutcomes = (
  page: number,
  pageSize: number,
  query?: unknown,
  sort?: unknown
) => {
  const { jwt } = useAuth();
  const queryClient = useQueryClient();
  const authToken = jwt ?? "";

  const queryString = QueryString.stringify(
    { filters: query, sort: sort },
    { encodeValuesOnly: true }
  );

  const outcomesQuery = useQuery<{
    outcomes: IncomeOutcomeProps[];
    total: number;
  }>({
    queryKey: ["outcomes", page, pageSize, query],
    queryFn: () => fetchOutcomes(authToken, page, pageSize, queryString),
    enabled: !!jwt,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<UpdateIncomeOutcomeDto>) =>
      createExpense(authToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outcomes"] });
      queryClient.invalidateQueries({ queryKey: ["outcomes-all"] });
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
      queryClient.invalidateQueries({ queryKey: ["outcomes-all"] });
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
      queryClient.invalidateQueries({ queryKey: ["outcomes-all"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["outcomes"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["outcomes-all"] });
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

// Получить до 1000 outcomes параллельными запросами по 100 штук
export const useOutcomesAll = (query?: unknown) => {
  const { jwt } = useAuth();
  const authToken = jwt ?? "";

  const resultsQuery = useQuery<IncomeOutcomeProps[], unknown>({
    queryKey: ["outcomes-all", query],
    enabled: !!jwt,
    queryFn: async () => {
      const pageSize = 100;
      const maxPages = 30;
      const sort = ["createdAt:desc"];
      const queryString = QueryString.stringify(
        { filters: query, sort },
        { encodeValuesOnly: true }
      );
      const requests = Array.from({ length: maxPages }, (_, idx) => {
        const page = idx + 1;
        return fetchOutcomes(authToken, page, pageSize, queryString);
      });
      const results = await Promise.all(requests);
      const allOutcomes = results.flatMap((r) => r.outcomes);
      return allOutcomes;
    },
  });

  return resultsQuery;
};
