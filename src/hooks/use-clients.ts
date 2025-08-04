"use strict";

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

  // Ключ запроса
  const queryKey = ["clients", page, pageSize, query];

  // Запрос всех клиентов
  const clientsQuery = useQuery<{ clients: ClientProps[]; total: number }>({
    queryKey,
    queryFn: () => fetchClients(authToken, page, pageSize, queryString),
    enabled: !!token,
  });

  // Создание клиента (оптимистичное обновление)
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
            { ...newClient, documentId: `temp-${Date.now()}` },
            ...previousData.clients,
          ],
          total: previousData.total + 1,
        });
      }

      return { previousData };
    },
    onError: (_err, _data, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"], exact: false });
    },
  });

  // Обновление клиента
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
    onError: (_err, _data, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"], exact: false });
    },
  });

  // Удаление клиента (оптимистично)
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
      queryClient.invalidateQueries({ queryKey: ["clients"], exact: false });
    },
  });

  return {
    clients: clientsQuery.data?.clients || [],
    total: clientsQuery.data?.total || 0,
    isLoading: clientsQuery.isLoading,
    isError: clientsQuery.isError,
    error: clientsQuery.error,
    createClient: createMutation.mutate,
    updateClient: updateMutation.mutate,
    deleteClient: deleteMutation.mutate,
  };
};
