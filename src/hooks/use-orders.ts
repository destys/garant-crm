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
import { MetaProps } from "@/types/meta.types";

/**
 * Хук для загрузки ВСЕХ заявок по фильтрам (для отчетов)
 */
export const useOrdersAll = (
  query?: unknown,
  sort?: unknown,
  enabled = false
) => {
  const { jwt } = useAuth();
  const authToken = jwt ?? "";
  const pageSize = 100;

  const queryString = qs.stringify(
    { filters: query, sort: sort ? sort : ["createdAt:desc"] },
    { encodeValuesOnly: true }
  );

  return useQuery({
    queryKey: ["orders-all", query, sort],
    enabled: !!jwt && enabled,
    queryFn: async () => {
      const firstPage = await fetchOrders(authToken, 1, pageSize, queryString);
      const total = firstPage.total;

      if (total <= pageSize) {
        return firstPage.orders;
      }

      const totalPages = Math.ceil(total / pageSize);
      const remainingPages = Math.min(totalPages - 1, 49);

      const requests = Array.from({ length: remainingPages }, (_, i) =>
        fetchOrders(authToken, i + 2, pageSize, queryString)
      );
      const results = await Promise.all(requests);

      return [firstPage.orders, ...results.map((r) => r.orders)].flat();
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
};

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
  const ordersQuery = useQuery<
    { orders: OrderProps[]; total: number; meta: MetaProps },
    Error
  >({
    queryKey: ["orders", page, pageSize, query],
    queryFn: () => fetchOrders(authToken, page, pageSize, queryString),
    enabled: !!token,
    // Кэшируем на 30 секунд — уменьшает количество запросов в сайдбаре
    staleTime: 1000 * 30,
  });

  // ✅ Создание заказа
  const createOrderMutation = useMutation({
    mutationFn: async (order: Partial<CreateOrderDto>) => {
      const created = await createOrder(authToken, order); // должен вернуть заказ с id
      const orderId = created.id;
      const orderKind = created.kind_of_repair;

      let prefix = "vz";
      if (orderKind === "Выездной") {
        prefix = "zov";
      } else if (orderKind === "UMedia") {
        prefix = "u";
      }

      await updateOrder(authToken, created.documentId, {
        title: `${prefix}-${orderId}`,
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
    meta: ordersQuery.data?.meta,
    total: ordersQuery.data?.total || 0,
    isLoading: ordersQuery.isLoading,
    isFetching: ordersQuery.isFetching,
    isError: ordersQuery.isError,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch,
    createOrder: createOrderMutation.mutateAsync,
    updateOrder: updateOrderMutation.mutateAsync,
    deleteOrder: deleteOrderMutation.mutateAsync,
  };
};
