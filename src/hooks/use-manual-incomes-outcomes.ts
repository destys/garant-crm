import qs from "qs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/providers/auth-provider";
import {
  fetchManualIOs,
  createManualIO,
  updateManualIO,
  deleteManualIO,
} from "@/services/manual-incomes-outcomes-service";
import { ManualIncomeOutcomeProps } from "@/types/manual-io.types";

/**
 * Хук для работы с manual incomes/outcomes (получение, создание, обновление, удаление)
 */
export const useManualIncomesOutcomes = (
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

  const queryKey = ["manualIOs", page, pageSize, query];

  // ✅ Получение списка (кэшируем на 30 секунд)
  const listQuery = useQuery<
    { items: ManualIncomeOutcomeProps[]; total: number },
    Error
  >({
    queryKey,
    queryFn: () => fetchManualIOs(authToken, page, pageSize, queryString),
    enabled: !!token,
    staleTime: 1000 * 30, // 30 секунд
  });

  // ✅ Создание
  const createMutation = useMutation({
    mutationFn: (payload: Partial<ManualIncomeOutcomeProps>) =>
      createManualIO(authToken, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manualIOs"] });
    },
  });

  // ✅ Обновление
  const updateMutation = useMutation({
    mutationFn: ({
      documentId,
      updatedData,
    }: {
      documentId: string;
      updatedData: Partial<ManualIncomeOutcomeProps>;
    }) => updateManualIO(authToken, documentId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manualIOs"] });
    },
  });

  // ✅ Удаление (с оптимистичным апдейтом)
  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteManualIO(authToken, documentId),
    onMutate: async (documentId: string) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<{
        items: ManualIncomeOutcomeProps[];
        total: number;
      }>(queryKey);

      if (previous) {
        queryClient.setQueryData(queryKey, {
          items: previous.items.filter((i) => i.documentId !== documentId),
          total: Math.max(previous.total - 1, 0),
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["manualIOs"], exact: false });
    },
  });

  return {
    data: listQuery.data?.items || [],
    total: listQuery.data?.total || 0,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,

    createManualIO: createMutation.mutateAsync,
    updateManualIO: updateMutation.mutateAsync,
    deleteManualIO: deleteMutation.mutateAsync,
  };
};
