'use client';

import { PlusCircleIcon } from "lucide-react"

import { SearchBlock } from "@/components/search-block"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table";
import { useUsers } from "@/hooks/use-users"
import { useModal } from "@/providers/modal-provider";

import { mastersColumns } from "./masters-columns"

export const MastersContent = () => {
    const { openModal } = useModal();
    const { users, updateUser, deleteUser } = useUsers(1, 100);
    return (
        <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <h1 className="flex-auto">Все мастера</h1>
                <SearchBlock />
            </div>
            <Button className="mb-10"
                onClick={() =>
                    openModal("addUser", { title: "Подтверждение" })
                }
            >
                <PlusCircleIcon />
                Добавить мастера
            </Button>
            <DataTable data={users} columns={mastersColumns(updateUser, deleteUser)} />
        </div>
    )
}
