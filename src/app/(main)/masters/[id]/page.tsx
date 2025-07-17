import { BanknoteArrowDownIcon, BanknoteArrowUpIcon } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { MasterEdit } from "@/components/masters/master-edit"
import { MasterLeads } from "@/components/masters/master-leads"
import { MasterAccounting } from "@/components/masters/master-accounting"

const MasterPage = () => {
    return (
        <div>
            <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-4 mb-8">
                <div>
                    <h1 className="flex-auto">Мастер: Иванов Иван Иванович</h1>

                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <p>Баланс:</p>
                        <p className="text-xl font-semibold text-green-500">{`50 000 ₽`}</p>
                    </div>
                </div>
            </div>
            <Tabs defaultValue="edit">
                <div className="flex items-center gap-8 lg:gap-16 mb-6">
                    <TabsList className="flex-auto">
                        <TabsTrigger value="edit">Редактирование</TabsTrigger>
                        <TabsTrigger value="leads">Заявки в работе</TabsTrigger>
                        <TabsTrigger value="accounting">Расчеты</TabsTrigger>
                    </TabsList>
                    <div className="flex gap-2">
                        <Button variant={'positive'}>
                            <BanknoteArrowUpIcon />
                        </Button>
                        <Button variant={'destructive'}>
                            <BanknoteArrowDownIcon />
                        </Button>
                    </div>
                </div>
                <TabsContent value="edit">
                    <MasterEdit />
                </TabsContent>
                <TabsContent value="leads">
                    <MasterLeads />
                </TabsContent>
                <TabsContent value="accounting">
                    <MasterAccounting />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default MasterPage