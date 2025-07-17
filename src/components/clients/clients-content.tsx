import { PlusCircleIcon } from "lucide-react"



import { demoClients } from "@/demo-data"

import { SearchBlock } from "../search-block"
import { Button } from "../ui/button"

import { ClientsTable } from "./clients-table"

export const ClientsContent = () => {
    return (
        <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <h1 className="flex-auto">Все клиенты</h1>
                <SearchBlock />
            </div>
            <Button className="mb-10">
                <PlusCircleIcon />
                Добавить клиента
            </Button>
            <ClientsTable data={demoClients} />
        </div>
    )
}
