'use client';

import { Loader2Icon } from "lucide-react"
import { useParams } from "next/navigation";
import { toast } from "sonner";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RepairOrderForm } from "@/components/orders/order-form"
import { OrderMedia } from "@/components/orders/order-photos"
import { OrderClient } from "@/components/orders/order-client"
import { OrderAccounting } from "@/components/orders/order-accounting"
import { useUsers } from "@/hooks/use-users";
import { useOrder } from "@/hooks/use-order";
import { OrderDocs } from "@/components/orders/order-docs";
import { useAuth } from "@/providers/auth-provider";


const OrderPage = () => {
    const { documentId } = useParams();
    const { users } = useUsers(1, 100);
    const { user, roleId } = useAuth();
    const { order, isLoading, updateOrder } = useOrder(documentId ? documentId.toString() : "");
    if (!order) return null;
    if (!user || !roleId || (roleId === 1 && order.master?.id !== user.id)) return <div>У вас нет доступа к данному заказу</div>;
    if (isLoading) return <Loader2Icon className="animate-spin" />

    // 1️⃣ Считаем доход = сумма incomes - сумма outcomes
    const totalIncome = (order.incomes || []).reduce((acc, item) => acc + (item.count || 0), 0)
    const totalOutcome = (order.outcomes || []).reduce((acc, item) => acc + (item.count || 0), 0)
    const profit = totalIncome - totalOutcome

    const handleSelectMaster = (value: string) => {
        updateOrder({
            master: {
                id: +value
            }
        })
    }

    const handleApprove = () => {
        updateOrder({
            is_revision: false,
            is_approve: true,
        })

        toast.success('Заказ утвержден')
    }
    const handleOnRevision = () => {
        updateOrder({
            is_revision: true,
            is_approve: false,
        })

        toast.success('Заказ отправден на доработку')
    }
    const handleOnApprove = () => {
        updateOrder({
            is_revision: false,
            is_approve: false,
        })

        toast.success('Заказ отправлен на проверку')
    }

    return (
        <div>
            <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-4 mb-8">
                <h1 className="flex-auto">Заказ №<span className="uppercase">{order.title}</span></h1>
                {roleId === 3 && (
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <p>Доход с заказа:</p>
                            <p className="text-xl font-semibold text-green-500">{profit} ₽</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Мастер:</span>
                            <Select onValueChange={handleSelectMaster} defaultValue={order.master?.id?.toString() || ""}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Выбрать" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((master) => (
                                        <SelectItem key={master.id} value={master.id.toString()}>
                                            {master.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

            </div>
            {(!order.is_revision && !order.is_approve && (order.orderStatus === "Отказ" || order.orderStatus === "Выдан")) && (
                <div className="flex gap-4 mb-6">
                    <Button variant={'destructive'} onClick={handleOnRevision}>На доработку</Button>
                    <Button variant={'positive'} onClick={handleApprove}>Утвердить</Button>
                </div>
            )}
            {order.is_revision && (
                <div className="flex gap-4 mb-6">
                    <Button variant={'positive'} onClick={handleOnApprove}>Отправить на проверку</Button>
                </div>
            )}
            {order.is_approve && (
                <div className="flex gap-4 mb-6">
                    <Button variant={'destructive'} onClick={handleOnRevision}>На доработку</Button>
                </div>
            )}
            <Tabs defaultValue="edit">
                <div className="flex flex-col md:flex-row md:items-center gap-8 lg:gap-16">
                    <TabsList className="md:flex-auto">
                        <TabsTrigger value="edit">Редактирование</TabsTrigger>
                        <TabsTrigger value="photo">Фото</TabsTrigger>
                        <TabsTrigger value="call">Звонки</TabsTrigger>
                        <TabsTrigger value="sms">СМС</TabsTrigger>
                        <TabsTrigger value="client">Клиент</TabsTrigger>
                        <TabsTrigger value="calculations">Расчеты</TabsTrigger>
                    </TabsList>
                    <OrderDocs data={order} />
                </div>
                <TabsContent value="edit">
                    <RepairOrderForm data={order} />
                </TabsContent>
                <TabsContent value="photo">
                    <OrderMedia data={order} />
                </TabsContent>
                <TabsContent value="call">Информация появится в будущем</TabsContent>
                <TabsContent value="sms">Информация появится в будущем</TabsContent>
                <TabsContent value="client">
                    <OrderClient data={order} />
                </TabsContent>
                <TabsContent value="calculations">
                    <OrderAccounting data={order} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default OrderPage