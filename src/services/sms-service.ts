import QueryString from "qs";

import { API_URL } from "@/constants";
import { SmsLogProps } from "@/types/sms.types";
import { MetaProps } from "@/types/meta.types";

const apiUrl = `${API_URL}/api/sms-logs`;

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка запроса: ${response.status} ${errorText}`);
  }
  return response.json();
};

export const fetchSmsLogs = async (
  token: string,
  page = 1,
  pageSize = 25,
  filterQuery = ""
): Promise<{ smsLogs: SmsLogProps[]; total: number; meta: MetaProps }> => {
  if (!token) throw new Error("Authentication token is missing");

  const query = QueryString.stringify(
    {
      pagination: { page, pageSize },
      sort: ["createdAt:desc"],
      populate: {
        order: { fields: ["id", "title"] },
        client: { fields: ["id", "name", "phone"] },
        user: { fields: ["id", "name"] },
      },
      ...(filterQuery && QueryString.parse(filterQuery)),
    },
    { encodeValuesOnly: true }
  );

  const response = await fetch(`${apiUrl}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await handleResponse(response);

  return {
    smsLogs: data.data,
    meta: data.meta,
    total: data.meta?.pagination?.total ?? 0,
  };
};

export const fetchSmsLogsByOrder = async (
  token: string,
  orderId: number,
  page = 1,
  pageSize = 50
): Promise<{ smsLogs: SmsLogProps[]; total: number; meta: MetaProps }> => {
  if (!token) throw new Error("Authentication token is missing");

  const query = QueryString.stringify(
    {
      pagination: { page, pageSize },
      sort: ["createdAt:desc"],
      filters: {
        order: { id: { $eq: orderId } },
      },
      populate: {
        order: { fields: ["id", "title"] },
        client: { fields: ["id", "name", "phone"] },
        user: { fields: ["id", "name"] },
      },
    },
    { encodeValuesOnly: true }
  );

  const response = await fetch(`${apiUrl}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await handleResponse(response);

  return {
    smsLogs: data.data,
    meta: data.meta,
    total: data.meta?.pagination?.total ?? 0,
  };
};

export const createSmsLog = async (
  token: string,
  smsData: {
    phone: string;
    text: string;
    orderId?: number;
    clientId?: number;
    userId?: number;
    commandId?: string;
    smsStatus?: string;
  }
): Promise<SmsLogProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        phone: smsData.phone,
        text: smsData.text,
        commandId: smsData.commandId || null,
        smsStatus: smsData.smsStatus || "pending",
        sentAt: new Date().toISOString(),
        order: smsData.orderId || null,
        client: smsData.clientId || null,
        user: smsData.userId || null,
      },
    }),
  });

  const data = await handleResponse(response);
  return data.data;
};

export const updateSmsLog = async (
  token: string,
  documentId: string,
  updatedData: Partial<SmsLogProps>
): Promise<SmsLogProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const response = await fetch(`${apiUrl}/${documentId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: updatedData }),
  });

  const data = await handleResponse(response);
  return data.data;
};

export const deleteSmsLog = async (
  token: string,
  documentId: string
): Promise<string> => {
  if (!token) throw new Error("Authentication token is missing");

  const response = await fetch(`${apiUrl}/${documentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  await handleResponse(response);
  return documentId;
};

export const sendSms = async (
  phone: string,
  text: string
): Promise<{ success: boolean; commandId?: string; error?: string }> => {
  const response = await fetch("/api/mango/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone, text }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Ошибка отправки SMS");
  }

  return data;
};
