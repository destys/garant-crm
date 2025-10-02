/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Loader2Icon } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RepairOrderForm } from "@/components/orders/order-form";
import { OrderMedia } from "@/components/orders/order-photos";
import { OrderClient } from "@/components/orders/order-client";
import { OrderAccounting } from "@/components/orders/order-accounting";
import { useUsers } from "@/hooks/use-users";
import { useOrder } from "@/hooks/use-order";
import { OrderDocs } from "@/components/orders/order-docs";
import { useAuth } from "@/providers/auth-provider";
import { OrderChat } from "@/components/orders/order-chat";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const OrderPage = () => {
  const { documentId } = useParams();
  const { users } = useUsers(1, 100);
  const { user, roleId } = useAuth();
  const { order, isLoading, updateOrder } = useOrder(
    documentId ? documentId.toString() : ""
  );
  const [activeTab, setActiveTab] = useState<
    "edit" | "photo" | "call" | "sms" | "client" | "chat" | "calculations"
  >("edit");
  const [pendingTab, setPendingTab] = useState<typeof activeTab | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleTabChange = (next: typeof activeTab) => {
    // если уходим с edit и форма грязная — блокируем и показываем подтверждение
    if (activeTab === "edit" && next !== "edit" && isFormDirty) {
      setPendingTab(next);
      setConfirmOpen(true);
      return;
    }
    setActiveTab(next);
  };

  const proceedSwitch = () => {
    if (pendingTab) setActiveTab(pendingTab);
    setPendingTab(null);
    setConfirmOpen(false);
  };

  if (!order) return null;
  if (!user || !roleId || (roleId === 1 && order.master?.id !== user.id))
    return <div>У вас нет доступа к данному заказу</div>;
  if (isLoading) return <Loader2Icon className="animate-spin" />;

  // 1️⃣ Считаем доход = сумма incomes - сумма outcomes
  const totalIncome = (order.incomes || []).reduce(
    (acc, item) => acc + (item.count || 0),
    0
  );
  const totalOutcome = (order.outcomes || []).reduce(
    (acc, item) => acc + (item.count || 0),
    0
  );
  const profit = totalIncome - totalOutcome;

  const handleSelectMaster = (value: string) => {
    updateOrder({
      master: {
        id: +value,
      },
    });
  };

  const handleApprove = () => {
    updateOrder({
      is_revision: false,
      is_approve: true,
    });

    toast.success("Заказ утвержден");
  };
  const handleOnRevision = () => {
    updateOrder({
      is_revision: true,
      is_approve: false,
    });

    toast.success("Заказ отправден на доработку");
  };
  const handleOnApprove = () => {
    updateOrder({
      is_revision: false,
      is_approve: false,
    });

    toast.success("Заказ отправлен на проверку");
  };

  return (
    <div>
      <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-4 mb-8">
        <h1 className="flex-auto">
          Заказ №<span className="uppercase">{order.title}</span>
        </h1>
        {roleId === 3 && (
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <p>Доход с заказа:</p>
              <p className="text-xl font-semibold text-green-500">{profit} ₽</p>
            </div>
            <div className="flex items-center gap-4">
              <span>Сотрудник:</span>
              <Select
                onValueChange={handleSelectMaster}
                defaultValue={order.master?.id?.toString() || ""}
              >
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
      {!order.is_revision &&
        !order.is_approve &&
        roleId === 3 &&
        (order.orderStatus === "Отказ" || order.orderStatus === "Выдан") && (
          <div className="flex gap-4 mb-6">
            <Button variant={"destructive"} onClick={handleOnRevision}>
              На доработку
            </Button>
            <Button variant={"positive"} onClick={handleApprove}>
              Утвердить
            </Button>
          </div>
        )}
      {order.is_revision && (
        <div className="flex gap-4 mb-6">
          <Button variant={"positive"} onClick={handleOnApprove}>
            Отправить на проверку
          </Button>
        </div>
      )}
      {order.is_approve && (
        <div className="flex gap-4 mb-6">
          <Button variant={"destructive"} onClick={handleOnRevision}>
            На доработку
          </Button>
        </div>
      )}
      <Tabs
        defaultValue="edit"
        value={activeTab}
        onValueChange={(v) => handleTabChange(v as any)}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-8 lg:gap-16">
          <TabsList className="md:flex-auto">
            <TabsTrigger value="edit">Редактирование</TabsTrigger>
            <TabsTrigger value="photo">Фото</TabsTrigger>
            <TabsTrigger value="call">Звонки</TabsTrigger>
            <TabsTrigger value="sms">СМС</TabsTrigger>
            <TabsTrigger value="client">Клиент</TabsTrigger>
            <TabsTrigger value="chat">Чат</TabsTrigger>
            <TabsTrigger value="calculations">Расчеты</TabsTrigger>
          </TabsList>
          <OrderDocs data={order} />
        </div>
        <TabsContent value="edit">
          <RepairOrderForm data={order} onDirtyChange={setIsFormDirty} />
        </TabsContent>
        <TabsContent value="photo">
          <OrderMedia data={order} />
        </TabsContent>
        <TabsContent value="call">Информация появится в будущем</TabsContent>
        <TabsContent value="sms">Информация появится в будущем</TabsContent>
        <TabsContent value="client">
          <OrderClient data={order} />
        </TabsContent>
        <TabsContent value="chat">
          <OrderChat data={order} />
        </TabsContent>
        <TabsContent value="calculations">
          <OrderAccounting data={order} />
        </TabsContent>
      </Tabs>

      {/* AlertDialog подтверждения */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Несохранённые изменения</AlertDialogTitle>
            <AlertDialogDescription>
              У вас есть несохранённые данные в форме. Сначала сохраните
              изменения или подтвердите переход.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingTab(null);
                setConfirmOpen(false);
              }}
            >
              Остаться
            </AlertDialogCancel>
            <AlertDialogAction onClick={proceedSwitch}>
              Всё равно перейти
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderPage;
