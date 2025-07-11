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

const OrderPage = () => {
    return (
        <div>
            <div className="flex justify-between items-center gap-4 mb-8">
                <h1 className="flex-auto">Заказ №ORD-1001</h1>
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
            <Tabs defaultValue="edit">
                <div className="flex items-center gap-8 lg:gap-16">
                    <TabsList className="flex-auto">
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
                        <Button>
                            <PrinterIcon />
                        </Button>
                    </div>
                </div>
                <TabsContent value="edit">Make changes to your account here.</TabsContent>
                <TabsContent value="photo">Change your password here.</TabsContent>
                <TabsContent value="call">Change your password here.</TabsContent>
                <TabsContent value="sms">Change your password here.</TabsContent>
                <TabsContent value="client">Change your password here.</TabsContent>
                <TabsContent value="calculations">Change your password here.</TabsContent>
            </Tabs>
        </div>
    )
}

export default OrderPage