import { PlusCircleIcon } from "lucide-react"

import { SearchBlock } from "@/components/search-block"
import { Button } from "@/components/ui/button"
import { demoMasters } from "@/demo-data"
import { DataTable } from "@/components/data-table"

import { mastersColumns } from "./masters-columns"

export const MastersContent = () => {
    return (
        <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <h1 className="flex-auto">Все мастера</h1>
                <SearchBlock />
            </div>
            <Button className="mb-10">
                <PlusCircleIcon />
                Добавить мастера
            </Button>
            <DataTable data={demoMasters} columns={mastersColumns} />
        </div>
    )
}
