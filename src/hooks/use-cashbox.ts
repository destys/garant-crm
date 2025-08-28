import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/providers/auth-provider";
import { fetchCashbox, updateCashbox } from "@/services/cashbox-service";
import { CashboxProps } from "@/types/cashbox.types";

/**
 * Хук для работы с кассой (single type)
 */
export const useCashbox = () => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? "";

  // Получение кассы
  const cashboxQuery = useQuery<CashboxProps, Error>({
    queryKey: ["cashbox"],
    queryFn: () => fetchCashbox(authToken),
    enabled: !!token,
  });

  // Обновление кассы
  const updateCashboxMutation = useMutation({
    mutationFn: (updatedData: Partial<CashboxProps>) =>
      updateCashbox(authToken, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashbox"] });
    },
  });

  return {
    cashbox: cashboxQuery.data,
    isLoading: cashboxQuery.isLoading,
    isError: cashboxQuery.isError,
    error: cashboxQuery.error,
    refetch: cashboxQuery.refetch,
    updateCashbox: updateCashboxMutation.mutateAsync,
  };
};
