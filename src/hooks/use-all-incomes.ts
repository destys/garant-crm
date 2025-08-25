/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import qs from "qs";
import { useMemo } from "react";

import { useAuth } from "@/providers/auth-provider";
import { useIncomes } from "@/hooks/use-incomes";
import { fetchIncomes } from "@/services/incomes-service";

import { useAllPages } from "./use-all-pages";

export function useAllIncomes(filters: any, pageSize = 100) {
  const { jwt } = useAuth();
  const {
    incomes: first = [],
    total = 0,
    isLoading,
  } = useIncomes(1, pageSize, filters);
  const queryString = useMemo(
    () => qs.stringify({ filters }, { encodeValuesOnly: true }),
    [filters]
  );
  return useAllPages({
    key: "incomes",
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
      const { incomes, total } = await fetchIncomes(token, page, size, qsStr);
      return { items: incomes, total };
    },
  });
}
