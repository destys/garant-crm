"use client";

import { useMemo } from "react";
import { useQueries, UseQueryResult } from "@tanstack/react-query";

type Page1<T> = {
  items: T[];
  total: number;
  isLoading: boolean;
};

type FetchFn<T> = (
  token: string,
  page: number,
  pageSize: number,
  queryString: string
) => Promise<{ items: T[]; total: number }>;

type Options<T> = {
  /** ключ базовый для react-query, напр. "orders" */
  key: string;
  token?: string | null;
  pageSize: number;
  queryString: string;
  page1: Page1<T>;
  fetchFn: FetchFn<T>;
};

export function useAllPages<T>({
  key,
  token,
  pageSize,
  queryString,
  page1,
  fetchFn,
}: Options<T>) {
  const pagesAfterFirst = Math.max(
    0,
    Math.ceil((page1.total || 0) / pageSize) - 1
  );

  const queries: UseQueryResult<{ items: T[]; total: number }>[] = useQueries({
    queries:
      pagesAfterFirst > 0
        ? Array.from({ length: pagesAfterFirst }, (_, i) => {
            const page = i + 2;
            return {
              queryKey: [key, "page", page, pageSize, queryString],
              queryFn: () => fetchFn(token ?? "", page, pageSize, queryString),
              enabled: !!token && page1.total > pageSize,
              staleTime: 60_000,
            };
          })
        : [],
  });

  const all = useMemo(() => {
    const rest = queries.flatMap((q) => q.data?.items ?? []);
    return [...(page1.items ?? []), ...rest];
  }, [page1.items, queries]);

  const isLoading = page1.isLoading || queries.some((q) => q.isLoading);

  return { items: all, total: page1.total, isLoading };
}
