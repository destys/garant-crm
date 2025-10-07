"use client";

import { useRouter } from "next/navigation";
import { format, differenceInDays } from "date-fns";
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatName } from "@/lib/utils";
import { useUsers } from "@/hooks/use-users";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/providers/auth-provider";
import { OrderProps } from "@/types/order.types";

import { ActionsCell } from "./order-action-cell";

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
  const router = useRouter();
  const { users } = useUsers(1, 100);
  const { updateOrder, deleteOrder } = useOrders(1, 100);
  const { roleId } = useAuth();

  if (!roleId) return <div>Ошибка</div>;

  const statusClass = statusColorMap[data.orderStatus] ?? "bg-gray-100";
  const deadline = data.deadline;
  const today = new Date();

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

  const row = { original: data };

  return (
    <Card
      className="flex flex-col justify-between h-full cursor-pointer hover:shadow-md transition"
      onClick={() => router.push(`/orders/${data.documentId}`)}
    >
      <CardHeader>
        <CardTitle className="space-y-2">
          <p className="uppercase">{data.title}</p>
          <div className="text-[10px] text-black/50">
            {format(data.createdAt, "dd.MM.yy HH:mm")}
          </div>
        </CardTitle>

        {/* Действия */}
        <CardAction
          className="space-x-2 mt-2"
          onClick={(e) => e.stopPropagation()} // блокируем переход
        >
          <ActionsCell
            row={row}
            roleId={roleId}
            updateOrder={updateOrder}
            deleteOrder={deleteOrder}
          />
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
            onClick={(e) => e.stopPropagation()} // не переходит по карточке
          >
            {data.add_phone || data.client.phone || "-"}
          </Link>
        </div>
        <div>
          <span className="font-medium">Адрес выезда:</span>{" "}
          {data.add_address || data.client.address || "-"}
        </div>
        <Separator />

        <div className="flex items-center justify-between gap-2">
          <div
            className="flex flex-col gap-2 items-center"
            onClick={(e) => e.stopPropagation()} // блокируем переход
          >
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
              <SelectTrigger>
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

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-1">
              Ст-сть:{" "}
              <Badge variant={+data.total_cost > 0 ? "success" : "default"}>
                {data.total_cost || 0} ₽
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-1">
              Пред-та:{" "}
              <Badge variant={+data.prepay > 0 ? "success" : "default"}>
                {data.prepay || 0} ₽
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
