import { ClientProps } from "@/types/client.types"
import { useUsers } from "@/hooks/use-users";
import { useOrders } from "@/hooks/use-orders";

import { OrdersCard } from "../orders/orders-card";
import { ordersColumns } from "../orders/orders-columns";
import { DataTable } from "../data-table";

export const ClientsLeads = ({ data }: { data: ClientProps }) => {
    const { users } = useUsers(1, 50);
    const query = {
        client: {
            documentId: data.documentId
        }
    }
    const { data: orders, updateOrder, deleteOrder } = useOrders(1, 50, query);


    return (
        <div>
            <DataTable
                data={orders}
                columns={ordersColumns(users, updateOrder, deleteOrder)}
                cardComponent={({ data }) => (
                    <OrdersCard data={data} />
                )}
            />
        </div>
    )
}
