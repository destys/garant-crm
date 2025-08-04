import { format, differenceInDays } from "date-fns"
import { LinkIcon, PhoneIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardAction,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OrderProps } from "@/types/order.types"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const statusColorMap: Record<string, string> = {
    "Новая": "bg-blue-300 hover:bg-blue-400",
    "Согласовать": "bg-orange-100 hover:bg-orange-200",
    "Отремонтировать": "bg-red-100 hover:bg-red-200",
    "Купить запчасти": "bg-yellow-100 hover:bg-yellow-200",
    "Готово": "bg-green-100 hover:bg-green-200",
    "Отправить курьера": "bg-lime-100 hover:bg-lime-200",
    "Отправить инженера": "bg-green-100 hover:bg-green-200",
    "Продать": "bg-purple-100 hover:bg-purple-200",
    "Юридический отдел": "bg-blue-100 hover:bg-blue-200",
    "Отказ": "bg-red-200 hover:bg-red-300",
    "Выдан": "bg-gray-100 hover:bg-gray-200",
    "Проверить": "bg-orange-100 hover:bg-orange-200",
}

export const OrdersCard = ({ data }: { data: OrderProps }) => {
    const statusClass = statusColorMap[data.orderStatus] ?? "bg-gray-100"
    const deadline = data.deadline ? new Date(data.deadline) : null
    const today = new Date()

    let deadlineText = deadline ? format(deadline, "dd.MM.yyyy") : "—"
    let deadlineClass = ""

    if (deadline) {
        const diff = differenceInDays(deadline, today)
        if (diff < 0) {
            deadlineText = `Просрочено на ${Math.abs(diff)} дн.`
            deadlineClass = "bg-red-100 text-red-800"
        } else if (diff <= 2) {
            deadlineText = `Осталось ${diff} дн.`
            deadlineClass = "bg-yellow-200 text-yellow-900"
        }
    }

    return (
        <Card className="flex flex-col justify-between h-full">
            <CardHeader>
                <CardTitle className="space-y-2">
                    <p className="uppercase">{data.title}</p>

                </CardTitle>
                <CardAction className="space-x-2 mt-2">
                    <Button size="icon" variant="secondary">
                        <PhoneIcon className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                        <Link href={`/orders/546asd5a6d4a56sd4a5ds45sadasghfgjg`}>
                            <LinkIcon className="size-4" />
                        </Link>
                    </Button>
                    <Button size="icon" variant="destructive">
                        <Trash2Icon className="size-4" />
                    </Button>
                </CardAction>
                <CardDescription className="mt-2">
                    <Badge className={cn("text-xs text-muted-foreground", statusClass)}>{data.orderStatus}</Badge>
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <div className="flex gap-4 text-sm text-muted-foreground">
                    Выезд: {data.departure_date ? format(new Date(data.departure_date), "dd.MM.yyyy") : "—"}
                    <Badge variant={deadlineClass ? "outline" : "default"} className={cn("ml-1 text-xs", deadlineClass)}>
                        {deadlineText}
                    </Badge>
                </div>
                <Separator />
                <div>
                    <span className="font-medium">Устройство:</span>{" "}
                    {data.device_type || "-"} / {data.brand || "-"} / {data.model || "-"}
                </div>
                <div>
                    <span className="font-medium">Оплата:</span>{" "}
                    {data.prepay ?? 0} ₽ / {data.total_cost ?? 0} ₽
                </div>
                <Separator />
                <div>
                    <span className="font-medium">Мастер:</span>{" "}
                    {data.master?.name ?? "—"}
                </div>
            </CardContent>
        </Card>
    )
}