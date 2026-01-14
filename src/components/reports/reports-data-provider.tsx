"use client";

import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from "react";
import { DateRange } from "react-day-picker";
import { useQueries } from "@tanstack/react-query";
import qs from "qs";

import { useOrders } from "@/hooks/use-orders";
import { useIncomes } from "@/hooks/use-incomes";
import { useOutcomes } from "@/hooks/use-outcomes";
import { fetchOrders } from "@/services/orders-service";
import { fetchIncomes } from "@/services/incomes-service";
import { fetchOutcomes } from "@/services/outcomes-service";
import { useAuth } from "@/providers/auth-provider";
import { OrderProps } from "@/types/order.types";
import { IncomeOutcomeProps } from "@/types/income-outcome.types";

const PAGE_SIZE = 100;

interface ReportsDataContextValue {
  orders: OrderProps[];
  incomes: IncomeOutcomeProps[];
  outcomes: IncomeOutcomeProps[];
  isLoading: boolean;
  range: DateRange | undefined;
}

const ReportsDataContext = createContext<ReportsDataContextValue | null>(null);

export const useReportsData = () => {
  const ctx = useContext(ReportsDataContext);
  if (!ctx) {
    throw new Error("useReportsData must be used within ReportsDataProvider");
  }
  return ctx;
};

interface Props {
  range: DateRange | undefined;
  children: ReactNode;
}

export const ReportsDataProvider = ({ range, children }: Props) => {
  const { jwt: token } = useAuth();

  // Фильтры для orders (по createdAt)
  const ordersFilters = useMemo(() => {
    if (!range?.from || !range?.to) return undefined;
    return {
      $and: [
        { createdAt: { $gte: range.from } },
        { createdAt: { $lte: range.to } },
      ],
    };
  }, [range]);

  // Фильтры для incomes/outcomes (по createdDate с fallback на createdAt)
  const accountingFilters = useMemo(() => {
    if (!range?.from || !range?.to) return undefined;
    return {
      $or: [
        {
          $and: [
            { createdDate: { $gte: range.from } },
            { createdDate: { $lte: range.to } },
          ],
        },
        {
          $and: [
            { createdDate: { $null: true } },
            { createdAt: { $gte: range.from } },
            { createdAt: { $lte: range.to } },
          ],
        },
      ],
    };
  }, [range]);

  // === ORDERS ===
  const {
    data: firstOrders = [],
    total: ordersTotal = 0,
    isLoading: ordersLoading,
  } = useOrders(1, PAGE_SIZE, ordersFilters);

  const ordersPageCount = Math.ceil(ordersTotal / PAGE_SIZE);

  const ordersQueryString = useMemo(
    () =>
      qs.stringify(
        { filters: ordersFilters, sort: ["createdAt:desc"] },
        { encodeValuesOnly: true }
      ),
    [ordersFilters]
  );

  const otherOrdersQueries = useQueries({
    queries:
      ordersPageCount > 1
        ? Array.from({ length: ordersPageCount - 1 }, (_, i) => {
            const page = i + 2;
            return {
              queryKey: ["reports-orders", page, PAGE_SIZE, ordersFilters],
              queryFn: () =>
                fetchOrders(token ?? "", page, PAGE_SIZE, ordersQueryString),
              enabled: !!token && ordersTotal > PAGE_SIZE,
              staleTime: 60_000,
            };
          })
        : [],
  });

  // === INCOMES ===
  const {
    incomes: firstIncomes = [],
    total: incomesTotal = 0,
    isLoading: incomesLoading,
  } = useIncomes(1, PAGE_SIZE, accountingFilters);

  const incomesPageCount = Math.ceil(incomesTotal / PAGE_SIZE);

  const incomesQueryString = useMemo(
    () =>
      qs.stringify({ filters: accountingFilters }, { encodeValuesOnly: true }),
    [accountingFilters]
  );

  const otherIncomesQueries = useQueries({
    queries:
      incomesPageCount > 1
        ? Array.from({ length: incomesPageCount - 1 }, (_, i) => {
            const page = i + 2;
            return {
              queryKey: ["reports-incomes", page, PAGE_SIZE, accountingFilters],
              queryFn: () =>
                fetchIncomes(token ?? "", page, PAGE_SIZE, incomesQueryString),
              enabled: !!token && incomesTotal > PAGE_SIZE,
              staleTime: 60_000,
            };
          })
        : [],
  });

  // === OUTCOMES ===
  const {
    outcomes: firstOutcomes = [],
    total: outcomesTotal = 0,
    isLoading: outcomesLoading,
  } = useOutcomes(1, PAGE_SIZE, accountingFilters);

  const outcomesPageCount = Math.ceil(outcomesTotal / PAGE_SIZE);

  const outcomesQueryString = useMemo(
    () =>
      qs.stringify({ filters: accountingFilters }, { encodeValuesOnly: true }),
    [accountingFilters]
  );

  const otherOutcomesQueries = useQueries({
    queries:
      outcomesPageCount > 1
        ? Array.from({ length: outcomesPageCount - 1 }, (_, i) => {
            const page = i + 2;
            return {
              queryKey: [
                "reports-outcomes",
                page,
                PAGE_SIZE,
                accountingFilters,
              ],
              queryFn: () =>
                fetchOutcomes(
                  token ?? "",
                  page,
                  PAGE_SIZE,
                  outcomesQueryString
                ),
              enabled: !!token && outcomesTotal > PAGE_SIZE,
              staleTime: 60_000,
            };
          })
        : [],
  });

  // === СОБИРАЕМ ВСЕ ДАННЫЕ ===
  const orders = useMemo(() => {
    const rest = otherOrdersQueries.flatMap((q) => q.data?.orders ?? []);
    return [...firstOrders, ...rest];
  }, [firstOrders, otherOrdersQueries]);

  const incomes = useMemo(() => {
    const rest = otherIncomesQueries.flatMap((q) => q.data?.incomes ?? []);
    return [...firstIncomes, ...rest];
  }, [firstIncomes, otherIncomesQueries]);

  const outcomes = useMemo(() => {
    const rest = otherOutcomesQueries.flatMap((q) => q.data?.outcomes ?? []);
    return [...firstOutcomes, ...rest];
  }, [firstOutcomes, otherOutcomesQueries]);

  const isLoading =
    ordersLoading ||
    incomesLoading ||
    outcomesLoading ||
    otherOrdersQueries.some((q) => q.isLoading) ||
    otherIncomesQueries.some((q) => q.isLoading) ||
    otherOutcomesQueries.some((q) => q.isLoading);

  const value = useMemo(
    () => ({
      orders,
      incomes,
      outcomes,
      isLoading,
      range,
    }),
    [orders, incomes, outcomes, isLoading, range]
  );

  return (
    <ReportsDataContext.Provider value={value}>
      {children}
    </ReportsDataContext.Provider>
  );
};
