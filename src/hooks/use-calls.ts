import qs from "qs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/providers/auth-provider";
import {
  fetchCalls,
  fetchCallById,
  fetchCallsByClient,
  updateCall,
  deleteCall,
  fetchUnknownCalls,
  deleteUnknownCall,
} from "@/services/calls-service";
import { CallProps } from "@/types/call.types";

export const useCalls = (
  page: number,
  pageSize: number,
  filters?: Record<string, unknown>,
) => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? "";

  const queryString = qs.stringify({ filters }, { encodeValuesOnly: true });

  const queryKey = ["calls", page, pageSize, filters];

  const callsQuery = useQuery({
    queryKey,
    queryFn: () => fetchCalls(authToken, page, pageSize, queryString),
    enabled: !!token,
    staleTime: 1000 * 30,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      documentId,
      updatedData,
    }: {
      documentId: string;
      updatedData: Partial<CallProps>;
    }) => updateCall(authToken, documentId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteCall(authToken, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
  });

  return {
    calls: callsQuery.data?.calls ?? [],
    total: callsQuery.data?.total ?? 0,
    meta: callsQuery.data?.meta,
    isLoading: callsQuery.isLoading,
    isError: callsQuery.isError,
    error: callsQuery.error,
    refetch: callsQuery.refetch,
    updateCall: updateMutation.mutateAsync,
    deleteCall: deleteMutation.mutateAsync,
  };
};

export const useCall = (documentId: string | null) => {
  const { jwt: token } = useAuth();
  const authToken = token ?? "";

  const query = useQuery({
    queryKey: ["call", documentId],
    queryFn: () => fetchCallById(authToken, documentId!),
    enabled: !!token && !!documentId,
    staleTime: 1000 * 30,
  });

  return {
    call: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useUnknownCalls = (
  page: number,
  pageSize: number,
  filters?: Record<string, unknown>,
) => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? "";

  const queryString = qs.stringify({ filters }, { encodeValuesOnly: true });

  const queryKey = ["unknownCalls", page, pageSize, filters];

  const callsQuery = useQuery({
    queryKey,
    queryFn: () => fetchUnknownCalls(authToken, page, pageSize, queryString),
    enabled: !!token,
    staleTime: 1000 * 30,
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      deleteUnknownCall(authToken, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unknownCalls"] });
    },
  });

  return {
    calls: callsQuery.data?.calls ?? [],
    total: callsQuery.data?.total ?? 0,
    meta: callsQuery.data?.meta,
    isLoading: callsQuery.isLoading,
    isError: callsQuery.isError,
    error: callsQuery.error,
    refetch: callsQuery.refetch,
    deleteUnknownCall: deleteMutation.mutateAsync,
  };
};

export const useClientCalls = (clientPhone: string | null, pageSize = 50) => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? "";

  const queryKey = ["calls", "client", clientPhone];

  const callsQuery = useQuery({
    queryKey,
    queryFn: () => fetchCallsByClient(authToken, clientPhone!, 1, pageSize),
    enabled: !!token && !!clientPhone,
    staleTime: 1000 * 30,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      documentId,
      updatedData,
    }: {
      documentId: string;
      updatedData: Partial<CallProps>;
    }) => updateCall(authToken, documentId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
  });

  return {
    calls: callsQuery.data?.calls ?? [],
    total: callsQuery.data?.total ?? 0,
    meta: callsQuery.data?.meta,
    isLoading: callsQuery.isLoading,
    isError: callsQuery.isError,
    error: callsQuery.error,
    refetch: callsQuery.refetch,
    updateCall: updateMutation.mutateAsync,
  };
};
