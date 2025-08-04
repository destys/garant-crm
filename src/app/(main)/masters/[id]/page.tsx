'use client';

import { BanknoteArrowDownIcon, BanknoteArrowUpIcon } from "lucide-react"
import { useParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { MasterEdit } from "@/components/masters/master-edit"
import { MasterLeads } from "@/components/masters/master-leads"
import { MasterAccounting } from "@/components/masters/master-accounting"
import { useUser } from "@/hooks/use-user"

const MasterPage = () => {
    const params = useParams();
    const { id } = params;
    const { data } = useUser(id ? +id : null);

    if (!data) return null;

    return (
        <div>
            <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-4 mb-8">
                <div>
                    <h1 className="flex-auto">Мастер: {data.name}</h1>

                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <p>Баланс:</p>
                        <p className="text-xl font-semibold text-green-500">{data.balance || 0} ₽</p>
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
                    <MasterEdit data={data} />
                </TabsContent>
                <TabsContent value="leads">
                    <MasterLeads data={data} />
                </TabsContent>
                <TabsContent value="accounting">
                    <MasterAccounting data={data} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default MasterPage