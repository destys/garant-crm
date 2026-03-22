"use client";

import { useState } from "react";
import {
  Loader2Icon,
  MessageSquareIcon,
  PhoneIcon,
  SendIcon,
  Trash2Icon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrderSms, useSmsTemplates } from "@/hooks/use-sms";
import { useAuth } from "@/providers/auth-provider";
import { OrderProps } from "@/types/order.types";
import { formatDate } from "@/lib/utils";

interface Props {
  data: OrderProps;
}

export const OrderSms = ({ data }: Props) => {
  const { roleId } = useAuth();
  const clientPhone = data.client?.phone || data.add_phone || "";

  const [text, setText] = useState("");

  const { smsLogs, isLoading, sendSms, isSending, deleteSmsLog } = useOrderSms(
    data.id
  );
  const { templates } = useSmsTemplates();

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setText(template.text);
    }
  };

  const handleSend = async () => {
    if (!clientPhone.trim()) {
      toast.error("У клиента не указан номер телефона");
      return;
    }
    if (!text.trim()) {
      toast.error("Введите текст сообщения");
      return;
    }

    try {
      await sendSms({
        phone: clientPhone.trim(),
        text: text.trim(),
        clientId: data.client?.id,
      });
      toast.success("SMS отправлено");
      setText("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка отправки SMS"
      );
    }
  };

  const handleDelete = async (documentId: string) => {
    const confirmed = confirm("Удалить эту запись?");
    if (!confirmed) return;

    try {
      await deleteSmsLog(documentId);
      toast.success("Запись удалена");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircleIcon className="h-3 w-3" />
            Доставлено
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="secondary" className="gap-1">
            <ClockIcon className="h-3 w-3" />
            Отправлено
          </Badge>
        );
      case "error":
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircleIcon className="h-3 w-3" />
            Ошибка
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <ClockIcon className="h-3 w-3" />
            {status || "Неизвестно"}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <SendIcon className="h-5 w-5" />
            Отправить SMS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!clientPhone ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
              У клиента не указан номер телефона. Добавьте номер в карточке клиента.
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Получатель:</span>
              <span className="font-mono font-medium">{clientPhone}</span>
              {data.client?.name && (
                <span className="text-muted-foreground">({data.client.name})</span>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Шаблон</label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Выбрать шаблон" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Текст сообщения</label>
            <Textarea
              placeholder="Введите текст SMS..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Символов: {text.length} / 160 (1 SMS)
              {text.length > 160 && ` = ${Math.ceil(text.length / 153)} SMS`}
            </p>
          </div>

          <Button
            onClick={handleSend}
            disabled={isSending || !clientPhone}
            className="w-full sm:w-auto"
          >
            {isSending ? (
              <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <SendIcon className="h-4 w-4 mr-2" />
            )}
            Отправить SMS
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquareIcon className="h-5 w-5" />
            История SMS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : smsLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              SMS по этому заказу пока нет
            </p>
          ) : (
            <div className="space-y-4">
              {smsLogs.map((sms) => (
                <div
                  key={sms.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm">{sms.phone}</span>
                        {getStatusBadge(sms.smsStatus)}
                      </div>
                      <p className="text-sm mt-2 text-muted-foreground break-words">
                        {sms.text}
                      </p>
                    </div>
                    {roleId === 3 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(sms.documentId)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Отправлено: {formatDate(sms.sentAt || sms.createdAt, "dd.MM.yyyy HH:mm")}
                    </span>
                    {sms.user?.name && <span>Отправитель: {sms.user.name}</span>}
                    {sms.deliveredAt && (
                      <span>
                        Доставлено: {formatDate(sms.deliveredAt, "dd.MM.yyyy HH:mm")}
                      </span>
                    )}
                  </div>
                  {sms.reason && (
                    <p className="text-xs text-red-500">Причина: {sms.reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
