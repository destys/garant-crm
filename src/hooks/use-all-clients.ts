/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import qs from "qs";
import { useMemo } from "react";

import { useAuth } from "@/providers/auth-provider";
import { useClients } from "@/hooks/use-clients";
import { fetchClients } from "@/services/clients-service";

import { useAllPages } from "./use-all-pages";

export function useAllClients(filters: any, pageSize = 100) {
  const { jwt } = useAuth();
  const {
    clients: first = [],
    total = 0,
    isLoading,
  } = useClients(1, pageSize, filters);
  const queryString = useMemo(
    () => qs.stringify({ filters }, { encodeValuesOnly: true }),
    [filters]
  );
  return useAllPages({
    key: "clients",
    token: jwt,
    pageSize,
    queryString,
    page1: { items: first, total, isLoading },
    fetchFn: async (
      token: string,
      page: number | undefined,
      size: number | undefined,
      qsStr: string | undefined
    ) => {
      const { clients, total } = await fetchClients(token, page, size, qsStr);
      return { items: clients, total };
    },
  });
}
