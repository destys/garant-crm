/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import qs from "qs";
import { useMemo } from "react";

import { useAuth } from "@/providers/auth-provider";
import { useOutcomes } from "@/hooks/use-outcomes";
import { fetchOutcomes } from "@/services/outcomes-service";

import { useAllPages } from "./use-all-pages";

export function useAllOutcomes(filters: any, pageSize = 100) {
  const { jwt } = useAuth();
  const {
    outcomes: first = [],
    total = 0,
    isLoading,
  } = useOutcomes(1, pageSize, filters);
  const queryString = useMemo(
    () => qs.stringify({ filters }, { encodeValuesOnly: true }),
    [filters]
  );
  return useAllPages({
    key: "outcomes",
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
      const { outcomes, total } = await fetchOutcomes(token, page, size, qsStr);
      return { items: outcomes, total };
    },
  });
}
