/* eslint-disable @typescript-eslint/no-explicit-any */
"use strict";

"use strict";

import { API_URL } from "@/constants";
import { ClientProps, UpdateClientDto } from "@/types/client.types";

const apiUrl = `${API_URL}/api/clients`;

// универсальная обработка fetch
const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Request failed: ${res.status} - ${errorText}`);
  }
  return res.json();
};

// Получение всех клиентов
export const fetchClients = async (
  token: string,
  page = 1,
  pageSize = 10,
  filterQuery = ""
): Promise<{ clients: ClientProps[]; total: number }> => {
  if (!token) throw new Error("Authentication token is missing");

  const url = `${apiUrl}?pagination[page]=${page}&populate=*&pagination[pageSize]=${pageSize}&sort=createdAt:desc${
    filterQuery ? `&${filterQuery}` : ""
  }`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await handleResponse<any>(res);

  return {
    clients: data.data,
    total: data.meta?.pagination?.total ?? 0,
  };
};

// Получение клиента по ID
export const fetchClientById = async (
  token: string,
  documentId: string
): Promise<ClientProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const res = await fetch(`${apiUrl}/${documentId}?populate=*`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await handleResponse<any>(res);
  return data.data;
};

// Создание клиента
export const createClient = async (
  token: string,
  clientData: Partial<UpdateClientDto>
): Promise<ClientProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: clientData }),
  });

  const data = await handleResponse<any>(res);
  return data.data;
};

// Обновление клиента
export const updateClient = async (
  token: string,
  documentId: string,
  updatedData: Partial<ClientProps>
): Promise<ClientProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const res = await fetch(`${apiUrl}/${documentId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: updatedData }),
  });

  const data = await handleResponse<any>(res);
  return data.data;
};

// Удаление клиента
export const deleteClient = async (
  token: string,
  documentId: string
): Promise<string> => {
  if (!token) throw new Error("Authentication token is missing");

  const res = await fetch(`${apiUrl}/${documentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await handleResponse(res);
  return documentId;
};
