"use client";

import { Loader2Icon, PlusCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useModal } from "@/providers/modal-provider";
import { Button } from "@/components/ui/button";
import { CashboxTable } from "@/components/cashbox/cashbox-table";
import { DataLoadingOverlay } from "@/components/data-loading-overlay";
import { useCashTransactions } from "@/hooks/use-cash-transactions";
import { useCashbox } from "@/hooks/use-cashbox";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
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

export const CashboxContent = () => {
  const { openModal } = useModal();
  const { roleId } = useAuth();

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

  useEffect(() => {
    setPage(pageFromUrl);
  }, [pageFromUrl]);

  const pushPage = (next: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(next));
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
    setPage(next);
  };

  const {
    items,
    total,
    pageCount,
    deleteCashTransaction,
    isLoading,
    isFetching,
  } = useCashTransactions(page, pageSize);
  const listBusy = isLoading || isFetching;
  const { cashbox, isLoading: cashboxLoading } = useCashbox();

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

  if (cashboxLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cashbox) return null;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="flex-auto">Все операции по кассе</h1>
        <div className="flex items-center gap-3 text-xl font-medium">
          Баланс кассы:{" "}
          <span
            className={cn(
              "text-2xl text-green-500",
              cashbox.balance < 0 && "text-red-500"
            )}
          >
            {cashbox?.balance} ₽
          </span>
        </div>
      </div>
      <Button
        className="mb-10"
        onClick={() =>
          openModal("addTransaction", { title: "Добавить транзакцию" })
        }
      >
        <PlusCircleIcon />
        Добавить операцию
      </Button>
      <DataLoadingOverlay show={listBusy} minHeight="min-h-[280px]">
        <CashboxTable
          data={items}
          deleteTransaction={() =>
            roleId !== 1 ? deleteCashTransaction : null
          }
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
