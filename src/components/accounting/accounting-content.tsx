/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { PlusIcon, SearchIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIncomes } from "@/hooks/use-incomes";
import { useOutcomes } from "@/hooks/use-outcomes";
import { useUsers } from "@/hooks/use-users";
import { useModal } from "@/providers/modal-provider";
import { useAuth } from "@/providers/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataLoadingOverlay } from "@/components/data-loading-overlay";

import "filepond/dist/filepond.min.css";
import "yet-another-react-lightbox/styles.css";

import { MastersContent } from "../masters/masters-content";

import { buildAccountingColumns } from "./accounting-columns";
import { AccountingTable } from "./accounting-table";

export const AccountingContent = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "approved" | "notApproved"
  >("all");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Получаем page из URL
  const getInt = (v: string | null, def = 1) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : def;
  };

  const pageFromUrl = getInt(searchParams.get("page"), 1);
  const [page, setPage] = useState<number>(pageFromUrl);
  const pageSize = 25;

  const isFirstMount = useRef(true);
  const prevFiltersRef = useRef<string>("");

  // При изменении URL обновляем состояние
  useEffect(() => {
    setPage(pageFromUrl);
  }, [pageFromUrl]);

  // Функция смены страницы
  const pushPage = (next: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(next));
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
    setPage(next);
  };

  // 🔍 Формируем фильтры для Strapi
  const searchFilter = useMemo(() => {
    if (!search.trim()) return {};
    const q = search.trim();
    return {
      $or: [
        { note: { $containsi: q } },
        { user: { name: { $containsi: q } } },
        { order: { title: { $containsi: q } } },
      ],
    };
  }, [search]);

  // Основной фильтр: комбинируем поиск + isApproved
  const baseFilter = useMemo(() => {
    const filters: Record<string, any> = {
      ...searchFilter,
      count: { $ne: 0 },
    };

    if (filterType === "approved") {
      filters.isApproved = { $eq: true };
    } else if (filterType === "notApproved") {
      filters.isApproved = { $eq: false };
    }

    return filters;
  }, [searchFilter, filterType]);

  // При изменении фильтров сбрасываем на первую страницу
  // Но НЕ на первом рендере и НЕ при возврате по истории браузера
  useEffect(() => {
    const currentFilters = JSON.stringify(baseFilter);
    
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevFiltersRef.current = currentFilters;
      return;
    }

    if (prevFiltersRef.current !== currentFilters) {
      prevFiltersRef.current = currentFilters;
      if (page !== 1) {
        pushPage(1);
      }
    }
  }, [JSON.stringify(baseFilter), page]);

  // Получаем данные с пагинацией
  const {
    incomes,
    total: incomesTotal,
    pageCount: incomesPageCount,
    isLoading: incomesLoading,
    isFetching: incomesFetching,
    updateIncome,
    deleteIncome,
  } = useIncomes(page, pageSize, baseFilter);

  const {
    outcomes,
    total: outcomesTotal,
    pageCount: outcomesPageCount,
    isLoading: outcomesLoading,
    isFetching: outcomesFetching,
    updateOutcome,
    deleteOutcome,
  } = useOutcomes(page, pageSize, baseFilter);

  const listBusy =
    incomesLoading ||
    outcomesLoading ||
    incomesFetching ||
    outcomesFetching;

  const { users, updateBalanceAtomic } = useUsers(1, 100);
  const { openModal } = useModal();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxImages, setLightboxImages] = useState<{ src: string }[]>([]);
  const { roleId } = useAuth();

  const columns = useMemo(
    () =>
      buildAccountingColumns({
        roleId,
        users,
        updateBalanceAtomic,
        updateIncome,
        deleteIncome,
        updateOutcome,
        deleteOutcome,
        setLightboxImages,
        setLightboxIndex,
        openModal,
      }),
    [roleId, users, updateBalanceAtomic, updateIncome, updateOutcome]
  );

  const allRows = useMemo(() => {
    return [
      ...incomes.map((i) => ({ ...i, type: "income" as const })),
      ...outcomes.map((o) => ({ ...o, type: "outcome" as const })),
    ].sort((a, b) => {
      const dateA = new Date(a.createdDate || a.createdAt).getTime();
      const dateB = new Date(b.createdDate || b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [incomes, outcomes]);

  // Для пагинации используем максимум из двух
  const total = Math.max(incomesTotal, outcomesTotal);
  const pageCount = Math.max(incomesPageCount, outcomesPageCount);
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = total ? Math.min(page * pageSize, total) : 0;

  const renderPagination = () => {
    const pages: (number | string)[] = [];
    if (pageCount <= 6) {
      pages.push(...Array.from({ length: pageCount }, (_, i) => i + 1));
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "...", pageCount);
      } else if (page >= pageCount - 2) {
        pages.push(
          1,
          "...",
          pageCount - 3,
          pageCount - 2,
          pageCount - 1,
          pageCount
        );
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", pageCount);
      }
    }
    return pages.map((p, i) => (
      <PaginationItem key={i}>
        {p === "..." ? (
          <span className="px-2">...</span>
        ) : (
          <PaginationLink
            href="#"
            isActive={p === page}
            className="px-2 py-1 text-sm"
            onClick={(e) => {
              e.preventDefault();
              if (!listBusy && p !== page) pushPage(p as number);
            }}
          >
            {p}
          </PaginationLink>
        )}
      </PaginationItem>
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center gap-4 mb-8 flex-wrap">
        <h1 className="flex-auto">Бухгалтерия: Движения по счету</h1>

        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по заказу, сотруднику, комментарию"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <Tabs id="accounting-tabs" defaultValue="accounting" className="my-6">
        <TabsList>
          <TabsTrigger value="accounting">Бухгалтерия</TabsTrigger>
          <TabsTrigger value="masters">Сотрудники</TabsTrigger>
        </TabsList>

        <TabsContent value="accounting">
          {/* Фильтры по статусу */}
          <div className="my-4 flex justify-between gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <Button
                size="sm"
                variant="default"
                className="w-full sm:w-auto"
                onClick={() =>
                  openModal("incomeOutcome", {
                    title: "Добавить приход",
                    props: { type: "income" },
                  })
                }
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                <span>Добавить приход</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() =>
                  openModal("incomeOutcome", {
                    title: "Добавить расход",
                    props: { type: "outcome" },
                  })
                }
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                <span>Добавить расход</span>
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                Все
              </Button>
              <Button
                variant={filterType === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("approved")}
              >
                Подтвержденные
              </Button>
              <Button
                variant={filterType === "notApproved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("notApproved")}
              >
                Не подтвержденные
              </Button>
            </div>
          </div>

          <DataLoadingOverlay show={listBusy} minHeight="min-h-[320px]">
            <AccountingTable data={allRows} columns={columns} />
          </DataLoadingOverlay>

          {/* Пагинация */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-4 mt-4">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {listBusy
                ? "Загрузка…"
                : total
                ? `${from}–${to} из ${total}`
                : "Нет данных"}
            </div>

            <div className="max-md:flex gap-3">
              <div className="block md:hidden w-full">
                <Select
                  value={String(page)}
                  onValueChange={(val) => {
                    const num = Number(val);
                    if (!isNaN(num)) pushPage(num);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите страницу" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                      (p) => (
                        <SelectItem key={p} value={String(p)}>
                          Стр. {p}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Pagination>
                <PaginationContent className="gap-2 overflow-x-auto">
                  {renderPagination()}
                </PaginationContent>
              </Pagination>
            </div>
          </div>

          {lightboxIndex !== null && (
            <Lightbox
              open
              index={lightboxIndex}
              close={() => setLightboxIndex(null)}
              slides={lightboxImages}
              className="relative z-10000"
            />
          )}
        </TabsContent>

        <TabsContent value="masters">
          <MastersContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};
