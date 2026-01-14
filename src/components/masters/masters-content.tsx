"use client";

import { PlusCircleIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { useUsers } from "@/hooks/use-users";
import { useModal } from "@/providers/modal-provider";

import { mastersColumns } from "./masters-columns";
import { MastersSearchBlock } from "./masters-search-block";

export const MastersContent = () => {
  const [searchFilter, setSearchFilter] = useState({});

  const filters = {
    ...searchFilter,
  };

  const { openModal } = useModal();
  const { users, updateUser, deleteUser, isLoading } = useUsers(
    1,
    100,
    filters
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="flex-auto">Все сотрудники</h1>
        <MastersSearchBlock onChange={setSearchFilter} />
      </div>
      <Button
        className="mb-10"
        onClick={() => openModal("addUser", { title: "Подтверждение" })}
      >
        <PlusCircleIcon />
        Добавить сотрудника
      </Button>
      <DataTable
        data={users}
        columns={mastersColumns(updateUser, deleteUser)}
        isLoading={isLoading}
      />
    </div>
  );
};
