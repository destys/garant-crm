/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { PlusCircleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useClients } from "@/hooks/use-clients";
import { useModal } from "@/providers/modal-provider";
import { Button } from "@/components/ui/button";
import { ClientsTable } from "@/components/clients/clients-table";
import { DataLoadingOverlay } from "@/components/data-loading-overlay";
import { ClientSearchBlock } from "@/components/clients/clients-search-block";
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

export const ClientsContent = () => {
  const [searchFilter, setSearchFilter] = useState({});

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInt = (v: string | null, def = 1) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : def;
  };

  const pageFromUrl = getInt(searchParams.get("page"), 1);
  const [page, setPage] = useState<number>(pageFromUrl);
  const pageSize = 25;

  const isFirstMount = useRef(true);
  const prevFiltersRef = useRef<string>("");

  useEffect(() => {
    setPage(pageFromUrl);
  }, [pageFromUrl]);

  const pushPage = (next: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(next));
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
    setPage(next);
  };

  const filters = {
    ...searchFilter,
  };

  // При изменении фильтров сбрасываем на первую страницу
  // Но НЕ на первом рендере и НЕ при возврате по истории браузера
  useEffect(() => {
    const currentFilters = JSON.stringify(filters);
    
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
  }, [JSON.stringify(filters), page]);

  const {
    clients,
    total,
    pageCount,
    deleteClient,
    isLoading,
    isFetching,
  } = useClients(page, pageSize, filters);
  const listBusy = isLoading || isFetching;
  const { openModal } = useModal();

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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="flex-auto">Все клиенты</h1>
        <ClientSearchBlock onChange={setSearchFilter} />
      </div>
      <Button
        className="mb-10"
        onClick={() => openModal("addClient", { title: "Создать клиента" })}
      >
        <PlusCircleIcon />
        Добавить клиента
      </Button>
      <DataLoadingOverlay show={listBusy} minHeight="min-h-[280px]">
        <ClientsTable
          data={clients}
          deleteClient={deleteClient}
          isLoading={listBusy}
        />
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
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    Стр. {p}
                  </SelectItem>
                ))}
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
    </div>
  );
};
