"use client";

import { PlusCircleIcon } from "lucide-react";
import { useState } from "react";

import { useClients } from "@/hooks/use-clients";
import { useModal } from "@/providers/modal-provider";
import { Button } from "@/components/ui/button";
import { ClientsTable } from "@/components/clients/clients-table";
import { ClientSearchBlock } from "@/components/clients/clients-search-block";

export const ClientsContent = () => {
  const [searchFilter, setSearchFilter] = useState({});

  const filters = {
    ...searchFilter,
  };

  const { clients, deleteClient, isLoading } = useClients(1, 500, filters);
  const { openModal } = useModal();

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
      <ClientsTable
        data={clients}
        deleteClient={deleteClient}
        isLoading={isLoading}
      />
    </div>
  );
};
