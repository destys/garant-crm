'use client';
import { useParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClients } from "@/hooks/use-clients";
import { ClientsEdit } from "@/components/clients/clients-edit";
import { ClientsLeads } from "@/components/clients/clients-leads";
import { RatingStars } from "@/components/rating-stars";

const ClientPage = () => {
    const params = useParams();

    const { documentId } = params;
    const filters = {
        documentId: documentId
    }

    const { clients } = useClients(1, 1, filters);
    const data = clients[0];

    if (!data) return null;

    return (
        <div>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
                <h1 className="flex-auto">Клиент: {data.name}</h1>
                <RatingStars value={data.rating} />
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