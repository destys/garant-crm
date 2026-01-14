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
    staleTime: 1000 * 30, // 30 секунд
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

/**
 * Оптимизированный хук для загрузки всех outcomes.
 * Сначала загружает первую страницу чтобы узнать total,
 * затем параллельно загружает только нужные страницы.
 */
export const useOutcomesAll = (query?: unknown) => {
  const { jwt } = useAuth();
  const authToken = jwt ?? "";
  const pageSize = 100;
  const sort = ["createdAt:desc"];

  const queryString = QueryString.stringify(
    { filters: query, sort },
    { encodeValuesOnly: true }
  );

  return useQuery<IncomeOutcomeProps[], unknown>({
    queryKey: ["outcomes-all", query],
    enabled: !!jwt,
    queryFn: async () => {
      // Сначала получаем первую страницу чтобы узнать total
      const firstPage = await fetchOutcomes(
        authToken,
        1,
        pageSize,
        queryString
      );
      const total = firstPage.total;

      // Если все данные на первой странице — возвращаем сразу
      if (total <= pageSize) {
        return firstPage.outcomes;
      }

      // Вычисляем сколько страниц нужно загрузить
      const totalPages = Math.ceil(total / pageSize);
      const remainingPages = Math.min(totalPages - 1, 49); // максимум 50 страниц

      // Загружаем остальные страницы параллельно
      const requests = Array.from({ length: remainingPages }, (_, i) =>
        fetchOutcomes(authToken, i + 2, pageSize, queryString)
      );
      const results = await Promise.all(requests);

      // Объединяем результаты
      return [firstPage.outcomes, ...results.map((r) => r.outcomes)].flat();
    },
    staleTime: 1000 * 60 * 2, // 2 минуты
    gcTime: 1000 * 60 * 10,
  });
};
