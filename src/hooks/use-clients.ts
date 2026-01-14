import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import QueryString from "qs";

import { useAuth } from "@/providers/auth-provider";
import { ClientProps, UpdateClientDto } from "@/types/client.types";
import {
  createClient,
  deleteClient,
  fetchClients,
  updateClient,
} from "@/services/clients-service";

export const useClients = (page: number, pageSize: number, query?: unknown) => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? "";

  const queryString = QueryString.stringify(
    { filters: query },
    { encodeValuesOnly: true }
  );

  const queryKey = ["clients", page, pageSize, query];

  const invalidateOrdersRelated = async () => {
    // 1) список заказов
    await queryClient.invalidateQueries({ queryKey: ["orders"], exact: false });
    // 2) все конкретные заказы ['order', *]
    await queryClient.invalidateQueries({
      predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "order",
    });
  };

  const clientsQuery = useQuery<{ clients: ClientProps[]; total: number }>({
    queryKey,
    queryFn: () => fetchClients(authToken, page, pageSize, queryString),
    enabled: !!token,
    staleTime: 1000 * 30, // 30 секунд
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<UpdateClientDto>) =>
      createClient(authToken, data),
    onMutate: async (newClient) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<{
        clients: ClientProps[];
        total: number;
      }>(queryKey);
      if (previousData) {
        queryClient.setQueryData(queryKey, {
          clients: [
            { ...newClient, documentId: `temp-${Date.now()}` } as ClientProps,
            ...previousData.clients,
          ],
          total: previousData.total + 1,
        });
      }
      return { previousData };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.previousData)
        queryClient.setQueryData(queryKey, ctx.previousData);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["clients"],
        exact: false,
      });
      await invalidateOrdersRelated(); // << важно
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      documentId,
      updatedData,
    }: {
      documentId: string;
      updatedData: Partial<ClientProps>;
    }) => updateClient(authToken, documentId, updatedData),
    onMutate: async ({ documentId, updatedData }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<{
        clients: ClientProps[];
        total: number;
      }>(queryKey);
      if (previousData) {
        queryClient.setQueryData(queryKey, {
          ...previousData,
          clients: previousData.clients.map((c) =>
            c.documentId === documentId ? { ...c, ...updatedData } : c
          ),
        });
      }
      return { previousData };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.previousData)
        queryClient.setQueryData(queryKey, ctx.previousData);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["clients"],
        exact: false,
      });
      await invalidateOrdersRelated(); // << важно
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteClient(authToken, documentId),
    onMutate: async (documentId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<{
        clients: ClientProps[];
        total: number;
      }>(queryKey);
      if (previousData) {
        queryClient.setQueryData(queryKey, {
          clients: previousData.clients.filter(
            (c) => c.documentId !== documentId
          ),
          total: previousData.total - 1,
        });
      }
      return { previousData };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previousData)
        queryClient.setQueryData(queryKey, ctx.previousData);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["clients"],
        exact: false,
      });
      await invalidateOrdersRelated(); // << важно
    },
  });

  return {
    clients: clientsQuery.data?.clients || [],
    total: clientsQuery.data?.total || 0,
    isLoading: clientsQuery.isLoading,
    isError: clientsQuery.isError,
    error: clientsQuery.error,
    // ВОЗВРАЩАЕМ mutateAsync, чтобы await в модалке реально ждал завершения
    createClient: createMutation.mutateAsync,
    updateClient: updateMutation.mutateAsync,
    deleteClient: deleteMutation.mutateAsync,
  };
};
