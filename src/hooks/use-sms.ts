import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/providers/auth-provider";
import {
  fetchSmsLogsByOrder,
  createSmsLog,
  deleteSmsLog,
  sendSms,
} from "@/services/sms-service";

export const useOrderSms = (orderId: number | null, pageSize = 50) => {
  const { jwt: token, user } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? "";

  const queryKey = ["smsLogs", "order", orderId];

  const smsQuery = useQuery({
    queryKey,
    queryFn: () => fetchSmsLogsByOrder(authToken, orderId!, 1, pageSize),
    enabled: !!token && !!orderId,
    staleTime: 1000 * 30,
  });

  const createMutation = useMutation({
    mutationFn: async ({
      phone,
      text,
      clientId,
    }: {
      phone: string;
      text: string;
      clientId?: number;
    }) => {
      const result = await sendSms(phone, text);

      const smsLog = await createSmsLog(authToken, {
        phone,
        text,
        orderId: orderId || undefined,
        clientId,
        userId: user?.id,
        commandId: result.commandId,
        smsStatus: result.success ? "sent" : "error",
      });

      return smsLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smsLogs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteSmsLog(authToken, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smsLogs"] });
    },
  });

  return {
    smsLogs: smsQuery.data?.smsLogs ?? [],
    total: smsQuery.data?.total ?? 0,
    meta: smsQuery.data?.meta,
    isLoading: smsQuery.isLoading,
    isError: smsQuery.isError,
    error: smsQuery.error,
    refetch: smsQuery.refetch,
    sendSms: createMutation.mutateAsync,
    isSending: createMutation.isPending,
    deleteSmsLog: deleteMutation.mutateAsync,
  };
};

export const useSmsTemplates = () => {
  const templates = [
    {
      id: "ready",
      label: "Готово к выдаче",
      text: "Ваше устройство готово к выдаче. Ждём вас по адресу: ...",
    },
    {
      id: "diagnostic",
      label: "Результат диагностики",
      text: "Диагностика завершена. Стоимость ремонта: ... Ожидаем вашего решения.",
    },
    {
      id: "parts",
      label: "Запчасти заказаны",
      text: "Запчасти для вашего устройства заказаны. Ориентировочный срок: ...",
    },
    {
      id: "pickup",
      label: "Забрать устройство",
      text: "Просим забрать ваше устройство. Срок хранения ограничен.",
    },
  ];

  return { templates };
};
