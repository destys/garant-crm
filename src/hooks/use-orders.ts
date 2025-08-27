import qs from "qs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { CreateOrderDto, OrderProps } from "@/types/order.types";
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
export const useOrders = (
  page: number,
  pageSize: number,
  query?: unknown,
  sort?: unknown
) => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? ""; // Если `token === null`, передаем пустую строку

  const queryString = qs.stringify(
    { filters: query, sort: sort ? sort : ["createdAt:desc"] },
    { encodeValuesOnly: true }
  );

  const queryKey = ["clients", page, pageSize, query];

  // ✅ Получение заказов (чистый массив + `total`)
  const ordersQuery = useQuery<{ orders: OrderProps[]; total: number }, Error>({
    queryKey: ["orders", page, pageSize, query],
    queryFn: () => fetchOrders(authToken, page, pageSize, queryString),
    enabled: !!token,
  });

  // ✅ Создание заказа
  const createOrderMutation = useMutation({
    mutationFn: async (order: Partial<CreateOrderDto>) => {
      const created = await createOrder(authToken, order); // должен вернуть заказ с id
      const orderId = created.id;

      // Обновляем title: vz-{id}
      await updateOrder(authToken, created.documentId, {
        title: `vz-${orderId}`,
      });

      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
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
    onMutate: async (documentId: string) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<{
        clients: OrderProps[];
        total: number;
      }>(queryKey);

      if (previousData) {
        queryClient.setQueryData(queryKey, {
          clients: previousData.clients.filter(
            (client) => client.documentId !== documentId
          ),
          total: previousData.total - 1,
        });
      }

      return { previousData };
    },
    onError: (_err, _documentId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"], exact: false });
    },
  });

  return {
    data: ordersQuery.data?.orders || [],
    total: ordersQuery.data?.total || 0,
    isLoading: ordersQuery.isLoading,
    isError: ordersQuery.isError,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch, // <-- пробрасываем refetch
    createOrder: createOrderMutation.mutateAsync,
    updateOrder: updateOrderMutation.mutateAsync,
    deleteOrder: deleteOrderMutation.mutate,
  };
};
