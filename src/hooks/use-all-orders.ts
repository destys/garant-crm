/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import qs from "qs";
import { useMemo } from "react";

import { useAuth } from "@/providers/auth-provider";
import { useOrders } from "@/hooks/use-orders";
import { fetchOrders } from "@/services/orders-service";

import { useAllPages } from "./use-all-pages";

export function useAllOrders(filters: any, pageSize = 100) {
  const { jwt } = useAuth();
  const {
    data: first = [],
    total = 0,
    isLoading,
  } = useOrders(1, pageSize, filters);
  const queryString = useMemo(
    () => qs.stringify({ filters }, { encodeValuesOnly: true }),
    [filters]
  );
  return useAllPages({
    key: "orders",
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
      const { orders, total } = await fetchOrders(token, page, size, qsStr);
      return { items: orders, total };
    },
  });
}
