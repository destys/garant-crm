/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { PlusIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIncomes, useIncomesAll } from "@/hooks/use-incomes";
import { useOutcomes, useOutcomesAll } from "@/hooks/use-outcomes";
import { useUsers } from "@/hooks/use-users";
import { useModal } from "@/providers/modal-provider";
import { useAuth } from "@/providers/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import "filepond/dist/filepond.min.css";
import "yet-another-react-lightbox/styles.css";
import { MastersContent } from "../masters/masters-content";

import { buildAccountingColumns } from "./accounting-columns";
import { AccountingTable } from "./accounting-table";

export const AccountingContent = () => {
  const [search, setSearch] = useState("");

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

  const inc = useIncomesAll(searchFilter);
  const out = useOutcomesAll(searchFilter);

  const incomes = inc.data ?? [];
  const outcomes = out?.data ?? [];

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
            <AccountingTable data={allRows} columns={columns} />

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
