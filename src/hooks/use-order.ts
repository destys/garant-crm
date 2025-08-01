import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/providers/auth-provider";
import { OrderProps } from "@/types/order.types";
import {
  fetchOrderById,
  updateOrder,
  deleteOrder,
} from "@/services/orders-service";

/**
 * Хук для работы с одним заказом
 */
export const useOrder = (documentId: string) => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? "";

  // Получение заказа
  const orderQuery = useQuery<OrderProps, Error>({
    queryKey: ["order", documentId], // уникальный ключ в кэше
    queryFn: () => fetchOrderById(authToken, documentId),
    enabled: !!token && !!documentId,
  });

  // Обновление заказа
  const updateOrderMutation = useMutation({
    mutationFn: (updatedData: Partial<OrderProps>) =>
      updateOrder(authToken, documentId, updatedData),
    onSuccess: () => {
      // Обновляем данные в кэше и у списка заказов
      queryClient.invalidateQueries({ queryKey: ["order", documentId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  // Удаление заказа
  const deleteOrderMutation = useMutation({
    mutationFn: () => deleteOrder(authToken, documentId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["order", documentId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  return {
    order: orderQuery.data,
    isLoading: orderQuery.isLoading,
    isError: orderQuery.isError,
    error: orderQuery.error,
    refetch: orderQuery.refetch, // можно вызвать для обновления данных
    updateOrder: updateOrderMutation.mutate,
    deleteOrder: deleteOrderMutation.mutate,
  };
};
