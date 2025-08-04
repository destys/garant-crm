'use client';

import { Loader2Icon, MailIcon, PhoneCallIcon, PrinterIcon } from "lucide-react"
import { useParams } from "next/navigation";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useOrders } from "@/hooks/use-orders"
import { useUsers } from "@/hooks/use-users";
import { useOrder } from "@/hooks/use-order";


const OrderPage = () => {
    const { documentId } = useParams();
    const { users } = useUsers(1, 100);

    const query = {
        documentId: documentId
    }

    const { updateOrder } = useOrders(1, 1, query)
    const { order, isLoading } = useOrder(documentId ? documentId.toString() : "");

    if (!order) return null;
    if (isLoading) return <Loader2Icon className="animate-spin" />

    // 1️⃣ Считаем доход = сумма incomes - сумма outcomes
    const totalIncome = (order.incomes || []).reduce((acc, item) => acc + (item.count || 0), 0)
    const totalOutcome = (order.outcomes || []).reduce((acc, item) => acc + (item.count || 0), 0)
    const profit = totalIncome - totalOutcome

    const handleSelectMaster = (value: string) => {
        updateOrder({
            documentId: order.documentId,
            updatedData: {
                master: {
                    id: +value
                }
            }
        })
    }

    return (
        <div>
            <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-4 mb-8">
                <h1 className="flex-auto">Заказ №<span className="uppercase">{order.title}</span></h1>
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
            </div>
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
                    <div className="flex gap-2">
                        <Button>
                            <PhoneCallIcon />
                        </Button>
                        <Button>
                            <MailIcon />
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button>
                                    <PrinterIcon />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="grid gap-4">
                                <Button variant={'secondary'}>Договор</Button>
                                <Button variant={'secondary'}>Акт</Button>
                                <Button variant={'secondary'}>Гарантия</Button>
                                <Button variant={'secondary'}>Техническое заключение</Button>
                            </PopoverContent>
                        </Popover>

                    </div>
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