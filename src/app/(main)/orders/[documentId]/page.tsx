import { MailIcon, PhoneCallIcon, PrinterIcon } from "lucide-react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { demoMasters } from "@/demo-data"
import RepairOrderForm from "@/components/orders/order-form"
import { OrderMedia } from "@/components/orders/order-photos"
import { OrderClient } from "@/components/orders/order-client"
import { OrderAccounting } from "@/components/orders/order-accounting"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const OrderPage = () => {
    return (
        <div>
            <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-4 mb-8">
                <h1 className="flex-auto">Заказ №ORD-1001</h1>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <p>Доход с заказа:</p>
                        <p className="text-xl font-semibold text-green-500">{`50 000 ₽`}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Мастер:</span>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Выбрать" />
                            </SelectTrigger>
                            <SelectContent>
                                {demoMasters.map((master) => (
                                    <SelectItem key={master.id} value={master.name}>
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
                    <RepairOrderForm />
                </TabsContent>
                <TabsContent value="photo">
                    <OrderMedia />
                </TabsContent>
                <TabsContent value="call">Информация появится в будущем</TabsContent>
                <TabsContent value="sms">Информация появится в будущем</TabsContent>
                <TabsContent value="client">
                    <OrderClient />
                </TabsContent>
                <TabsContent value="calculations">
                    <OrderAccounting />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default OrderPage