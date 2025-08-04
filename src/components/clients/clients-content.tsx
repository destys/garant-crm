'use client';
import { PlusCircleIcon } from "lucide-react"

import { useClients } from "@/hooks/use-clients";
import { useModal } from "@/providers/modal-provider";

import { SearchBlock } from "../search-block"
import { Button } from "../ui/button"

import { ClientsTable } from "./clients-table"

export const ClientsContent = () => {
    const { clients, deleteClient } = useClients(1, 500);
    const { openModal } = useModal();

    return (
        <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <h1 className="flex-auto">Все клиенты</h1>
                <SearchBlock />
            </div>
            <Button className="mb-10"
                onClick={() =>
                    openModal("addClient", { title: "Создать клиента" })
                }
            >
                <PlusCircleIcon />
                Добавить клиента
            </Button>
            <ClientsTable data={clients} deleteClient={deleteClient} />
        </div>
    )
}
