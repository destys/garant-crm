'use client';
import React, { Usable } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClients } from "@/hooks/use-clients";
import { ClientsEdit } from "@/components/clients/clients-edit";
import { ClientsLeads } from "@/components/clients/clients-leads";

interface Props {
    documentId: number;
}

const ClientPage = ({ params }: { params: Usable<Props> }) => {
    const { documentId } = React.use(params);

    const query = `&filters[documentId]=${documentId}`;

    const { clients } = useClients(1, 1, query);
    const data = clients[0];

    if (!data) return null;

    return (
        <div>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
                <h1 className="flex-auto">Клиент: {data.name}</h1>
            </div>
            <Tabs defaultValue="edit">
                <div className="flex items-center gap-8 lg:gap-16 mb-6">
                    <TabsList className="flex-auto">
                        <TabsTrigger value="edit">Редактирование</TabsTrigger>
                        <TabsTrigger value="leads">Заявки</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="edit">
                    <ClientsEdit data={data} />
                </TabsContent>
                <TabsContent value="leads">
                    <ClientsLeads data={data} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ClientPage