import { format, differenceInDays } from "date-fns";
import { LinkIcon, PhoneIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderProps } from "@/types/order.types";
import { cn, formatName } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUsers } from "@/hooks/use-users";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/providers/auth-provider";

const statusColorMap: Record<string, string> = {
  Новая: "bg-blue-300 hover:bg-blue-400",
  Согласовать: "bg-orange-100 hover:bg-orange-200",
  Отремонтировать: "bg-red-100 hover:bg-red-200",
  "Купить запчасти": "bg-yellow-100 hover:bg-yellow-200",
  Готово: "bg-green-100 hover:bg-green-200",
  "Отправить курьера": "bg-lime-100 hover:bg-lime-200",
  "Отправить инженера": "bg-green-100 hover:bg-green-200",
  Продать: "bg-purple-100 hover:bg-purple-200",
  "Юридический отдел": "bg-blue-100 hover:bg-blue-200",
  Отказ: "bg-red-200 hover:bg-red-300",
  Выдан: "bg-gray-100 hover:bg-gray-200",
  Проверить: "bg-orange-100 hover:bg-orange-200",
};

export const OrdersCard = ({ data }: { data: OrderProps }) => {
  const statusClass = statusColorMap[data.orderStatus] ?? "bg-gray-100";
  const deadline = data.deadline;
  const today = new Date();
  const { users } = useUsers(1, 100);
  const { updateOrder, deleteOrder } = useOrders(1, 100);
  const { roleId } = useAuth();

  let deadlineText = deadline ? format(deadline, "dd.MM.yyyy") : "Не указан";
  let deadlineClass = "";

  if (deadline) {
    const diff = differenceInDays(deadline, today);
    if (diff < 0) {
      deadlineText = `Просрочено на ${Math.abs(diff)} дн.`;
      deadlineClass = "bg-red-100 text-red-800";
    } else if (diff <= 2) {
      deadlineText = `Осталось ${diff} дн.`;
      deadlineClass = "bg-yellow-200 text-yellow-900";
    }
  }

  return (
    <Card className="flex flex-col justify-between h-full">
      <CardHeader>
        <CardTitle className="space-y-2">
          <p className="uppercase">{data.title}</p>
          <div className="text-[10px] text-black/50">
            {format(data.createdAt, "dd.MM.yy hh:mm")}
          </div>
        </CardTitle>
        <CardAction className="space-x-2 mt-2">
          <Button size="icon" variant="default" asChild>
            <Link href={`tel:${data.add_phone || data.client.phone}`}>
              <PhoneIcon className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/orders/${data.documentId}`}>
              <LinkIcon className="size-4" />
            </Link>
          </Button>
          {roleId === 3 && (
            <Button
              size="icon"
              variant="destructive"
              onClick={() => deleteOrder(data.documentId)}
            >
              <Trash2Icon className="size-4" />
            </Button>
          )}
        </CardAction>
        <CardDescription className="mt-2">
          <Badge className={cn("text-xs text-muted-foreground", statusClass)}>
            {data.orderStatus}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <div className="flex gap-4 text-sm text-muted-foreground">
          Дата выезда:{" "}
          {data.visit_date
            ? format(new Date(data.visit_date), "dd.MM.yyyy")
            : "—"}
        </div>
        <div className="flex gap-4 text-muted-foreground">
          Дедлайн:{" "}
          <Badge
            variant={deadlineClass ? "outline" : "default"}
            className={cn("ml-1 text-xs", deadlineClass)}
          >
            {deadlineText}
          </Badge>
        </div>
        <Badge>Создал: {formatName(data.author)}</Badge>
        <Separator />
        <div>
          <span className="font-medium">Тип техники:</span>{" "}
          {data.device_type || "-"}
        </div>
        <div>
          <span className="font-medium">Производитель и модель:</span>{" "}
          {data.brand || "-"} / {data.model || "-"}
        </div>
        <div>
          <span className="font-medium">Неисправность:</span>{" "}
          {data.defect || "-"}
        </div>
        <div>
          <span className="font-medium">Комментарий:</span> {data.note || "-"}
        </div>
        {data.orderStatus === "Отказ" && (
          <div>
            <span className="font-medium">Причина отказа:</span>{" "}
            {data.reason_for_refusal || "-"}
          </div>
        )}
        <Separator />
        <div>
          <span className="font-medium">Номер клиента:</span>{" "}
          <Link
            href={`tel:${data.add_phone || data.client.phone}`}
            className="font-medium transition-colors hover:text-blue-500"
          >
            {data.add_phone || data.client.phone || "-"}
          </Link>
        </div>
        <div>
          <span className="font-medium">Адрес выезда:</span>{" "}
          {data.add_address || data.client.address || "-"}
        </div>
        <Separator />
        <div className="flex gap-2 items-center">
          <span className="font-medium">Сотрудник:</span>{" "}
          <Select
            defaultValue={data.master?.id?.toString()}
            onValueChange={(value) => {
              updateOrder({
                documentId: data.documentId,
                updatedData: { master: { id: +value } },
              });

              toast.success("Сотрудник назначен");
            }}
          >
            <SelectTrigger className="">
              <SelectValue placeholder="Выбрать" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
