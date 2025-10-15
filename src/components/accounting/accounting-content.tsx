"use client";

import { PlusIcon, SearchIcon } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import Lightbox from "yet-another-react-lightbox";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIncomes } from "@/hooks/use-incomes";
import { useOutcomes } from "@/hooks/use-outcomes";
import { useUsers } from "@/hooks/use-users";
import { useModal } from "@/providers/modal-provider";
import { useAuth } from "@/providers/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import "filepond/dist/filepond.min.css";
import "yet-another-react-lightbox/styles.css";
import { MastersContent } from "../masters/masters-content";

import { buildAccountingColumns } from "./accounting-columns";

export const AccountingContent = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

  // Получаем данные с фильтром
  const { updateIncome, deleteIncome } = useIncomes(1, 1);
  const { updateOutcome, deleteOutcome } = useOutcomes(1, 1);

  const inc = useIncomes(page, 250, searchFilter);
  const out = useOutcomes(page, 250, searchFilter);

  const incomes = inc?.incomes ?? [];
  const outcomes = out?.outcomes ?? [];

  const { users, updateUser } = useUsers(1, 100);
  const { openModal } = useModal();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxImages, setLightboxImages] = useState<{ src: string }[]>([]);
  const { roleId } = useAuth();

  const columns = useMemo(
    () =>
      buildAccountingColumns({
        roleId,
        users,
        updateUser,
        updateIncome,
        deleteIncome,
        updateOutcome,
        deleteOutcome,
        setLightboxImages,
        setLightboxIndex,
        openModal,
      }),
    [roleId, users, updateUser, updateIncome, updateOutcome]
  );

  const allRows = useMemo(() => {
    return [
      ...incomes.map((i) => ({ ...i, type: "income" as const })),
      ...outcomes.map((o) => ({ ...o, type: "expense" as const })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [incomes, outcomes]);

  // Клиентская пагинация (по API Strapi можно будет сделать позже)
  const PER_PAGE = 36;
  const total = allRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handlePageChange = (p: number) => {
    const newPage = Math.max(1, Math.min(totalPages, p));
    setPage(newPage);
  };

  const start = (page - 1) * PER_PAGE;
  const end = Math.min(start + PER_PAGE, total);
  const pageRows = useMemo(
    () => allRows.slice(start, end),
    [allRows, start, end]
  );

  return (
    <div>
      <div className="flex justify-between items-center gap-4 mb-8 flex-wrap">
        <h1 className="flex-auto">Бухгалтерия: Движения по счету</h1>

        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по заказу, сотруднику, комментарию"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
      </div>

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

      <Tabs id="accounting-tabs" defaultValue="accounting" className="my-6">
        <TabsList>
          <TabsTrigger value="accounting">Бухгалтерия</TabsTrigger>
          <TabsTrigger value="masters">Сотрудники</TabsTrigger>
        </TabsList>

        <TabsContent value="accounting">
          <div>
            <DataTable data={pageRows} columns={columns} />

            {/* Простая пагинация */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Показано{" "}
                <strong>
                  {end} из {total}
                </strong>{" "}
                записей (стр. {page} / {totalPages})
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="px-2 h-9 border rounded-md disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const offset = Math.max(
                    1,
                    Math.min(page - 2, totalPages - 4)
                  );
                  const num = offset + i;
                  if (num > totalPages) return null;
                  return (
                    <button
                      key={num}
                      className={`px-3 h-9 border rounded-md ${
                        num === page ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => handlePageChange(num)}
                    >
                      {num}
                    </button>
                  );
                })}
                <button
                  className="px-2 h-9 border rounded-md disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  ›
                </button>
              </div>
            </div>

            {lightboxIndex !== null && (
              <Lightbox
                open
                index={lightboxIndex}
                close={() => setLightboxIndex(null)}
                slides={lightboxImages}
                className="relative z-[10000]"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="masters">
          <MastersContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};
