// services/manual-incomes-outcomes-service.ts
import QueryString from "qs";

import { API_URL } from "@/constants";
import { ManualIncomeOutcomeProps } from "@/types/manual-io.types";
const apiUrl = `${API_URL}/api/manual-incomes-outcomes`;

/** Универсальная обработка ответа */
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка запроса: ${response.status} ${errorText}`);
  }
  return response.json();
};

/** Получение списка записей с фильтрацией и пагинацией */
export const fetchManualIOs = async (
  token: string,
  page = 1,
  pageSize = 10,
  filterQuery = ""
): Promise<{ items: ManualIncomeOutcomeProps[]; total: number }> => {
  if (!token) throw new Error("Authentication token is missing");

  const query = QueryString.stringify(
    {
      pagination: { page, pageSize },
      sort: ["date:desc"], // по умолчанию свежие сверху
      populate: "*",
      ...(filterQuery && QueryString.parse(filterQuery)),
    },
    { encodeValuesOnly: true }
  );

  const response = await fetch(`${apiUrl}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await handleResponse(response);

  return {
    items: data.data,
    total: data.meta?.pagination?.total ?? 0,
  };
};

/** Получение одной записи по documentId */
export const fetchManualIOById = async (
  token: string,
  documentId: string
): Promise<ManualIncomeOutcomeProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const query = QueryString.stringify(
    {
      populate: {
        user: { populate: "*" },
      },
    },
    { encodeValuesOnly: true }
  );

  const response = await fetch(`${apiUrl}/${documentId}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await handleResponse(response);
  return data.data;
};

/** Создание записи */
export const createManualIO = async (
  token: string,
  payload: Partial<ManualIncomeOutcomeProps>
): Promise<ManualIncomeOutcomeProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: payload }),
  });

  const data = await handleResponse(response);
  return data.data;
};

/** Обновление записи */
export const updateManualIO = async (
  token: string,
  documentId: string,
  updatedData: Partial<ManualIncomeOutcomeProps>
): Promise<ManualIncomeOutcomeProps> => {
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

/** Удаление записи */
export const deleteManualIO = async (
  token: string,
  documentId: string
): Promise<string> => {
  if (!token) throw new Error("Authentication token is missing");

  const response = await fetch(`${apiUrl}/${documentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка удаления: ${response.status} ${errorText}`);
  }

  return documentId;
};
