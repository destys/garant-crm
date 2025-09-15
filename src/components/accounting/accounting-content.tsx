"use client";

import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useEffect } from "react";
import Lightbox from "yet-another-react-lightbox";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useIncomes } from "@/hooks/use-incomes";
import { useOutcomes } from "@/hooks/use-outcomes";
import { useUsers } from "@/hooks/use-users";
import { useModal } from "@/providers/modal-provider";
import { useAuth } from "@/providers/auth-provider";

import "filepond/dist/filepond.min.css";
import "yet-another-react-lightbox/styles.css";
import { buildAccountingColumns } from "./accounting-columns";

export const AccountingContent = () => {
  // Загружаем по 4 страницы из Strapi (ограничение 250 → всего 1000)
  const inc1 = useIncomes(1, 250);
  const inc2 = useIncomes(2, 250);
  const inc3 = useIncomes(3, 250);
  const inc4 = useIncomes(4, 250);

  const out1 = useOutcomes(1, 250);
  const out2 = useOutcomes(2, 250);
  const out3 = useOutcomes(3, 250);
  const out4 = useOutcomes(4, 250);

  const incomes = useMemo(
    () => [
      ...(inc1?.incomes ?? []),
      ...(inc2?.incomes ?? []),
      ...(inc3?.incomes ?? []),
      ...(inc4?.incomes ?? []),
    ],
    [inc1?.incomes, inc2?.incomes, inc3?.incomes, inc4?.incomes]
  );

  const outcomes = useMemo(
    () => [
      ...(out1?.outcomes ?? []),
      ...(out2?.outcomes ?? []),
      ...(out3?.outcomes ?? []),
      ...(out4?.outcomes ?? []),
    ],
    [out1?.outcomes, out2?.outcomes, out3?.outcomes, out4?.outcomes]
  );

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
        useIncomes,
        useOutcomes,
        setLightboxImages,
        setLightboxIndex,
      }),
    [roleId, users, updateUser, useIncomes, useOutcomes]
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

  // Простая клиентская пагинация
  const PER_PAGE = 36; // можно поменять при желании
  const [page, setPage] = useState(1);

  const total = allRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  // Если после догрузки страниц номер страницы вышел за пределы — откатим
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const start = (page - 1) * PER_PAGE;
  const end = Math.min(start + PER_PAGE, total);
  const pageRows = useMemo(
    () => allRows.slice(start, end),
    [allRows, start, end]
  );

  return (
    <div>
      <div className="flex justify-between items-center gap-4 mb-8">
        <h1 className="flex-auto">Бухгалтерия: Движения по счету</h1>
      </div>
      <div className="flex gap-4">
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
            onClick={() => setPage(1)}
          >
            «
          </button>
          <button
            className="px-2 h-9 border rounded-md disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          {/* Короткий диапазон номеров */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // центрируем вокруг текущей страницы
            const offset = Math.max(1, Math.min(page - 2, totalPages - 4));
            const num = offset + i;
            if (num > totalPages) return null;
            return (
              <button
                key={num}
                className={`px-3 h-9 border rounded-md ${
                  num === page ? "bg-primary text-primary-foreground" : ""
                }`}
                onClick={() => setPage(num)}
              >
                {num}
              </button>
            );
          })}
          <button
            className="px-2 h-9 border rounded-md disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            ›
          </button>
          <button
            className="px-2 h-9 border rounded-md disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage(totalPages)}
          >
            »
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
  );
};
