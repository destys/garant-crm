import qs from "qs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { OrderProps } from "@/types/order.types";
import {
  fetchOrders,
  createOrder,
  updateOrder,
  deleteOrder,
} from "@/services/orders-service";
import { useAuth } from "@/providers/auth-provider";

/**
 * Хук для работы с заказами (получение, создание, обновление, удаление)
 */
export const useOrders = (page: number, pageSize: number, query?: unknown) => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? ""; // Если `token === null`, передаем пустую строку

  const queryString = qs.stringify(
    { filters: query },
    { encodeValuesOnly: true }
  );

  // ✅ Получение заказов (чистый массив + `total`)
  const ordersQuery = useQuery<{ orders: OrderProps[]; total: number }, Error>({
    queryKey: ["orders", page, pageSize, query],
    queryFn: () => fetchOrders(authToken, page, pageSize, queryString),
    enabled: !!token,
  });

  // ✅ Создание заказа
  const createOrderMutation = useMutation({
    mutationFn: (order: Partial<OrderProps>) => createOrder(authToken, order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  // ✅ Обновление заказа
  const updateOrderMutation = useMutation({
    mutationFn: ({
      documentId,
      updatedData,
    }: {
      documentId: string;
      updatedData: Partial<OrderProps>;
    }) => updateOrder(authToken, documentId, updatedData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  // ✅ Удаление заказа
  const deleteOrderMutation = useMutation({
    mutationFn: (documentId: string) => deleteOrder(authToken, documentId),
    onSuccess: (_, documentId) => {
      queryClient.setQueriesData<{ orders: OrderProps[]; total: number }>(
        { queryKey: ["orders"] }, // обновляем все кэши с этим ключом
        (oldData) => {
          if (!oldData) return { orders: [], total: 0 };
          return {
            orders: oldData.orders.filter(
              (order) => order.documentId !== documentId
            ),
            total: oldData.total - 1,
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] }); // сбросим кэш и перезапросим
    },
  });

  return {
    data: ordersQuery.data?.orders || [],
    total: ordersQuery.data?.total || 0,
    isLoading: ordersQuery.isLoading,
    isError: ordersQuery.isError,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch, // <-- пробрасываем refetch
    createOrder: createOrderMutation.mutate,
    updateOrder: updateOrderMutation.mutate,
    deleteOrder: deleteOrderMutation.mutate,
  };
};
