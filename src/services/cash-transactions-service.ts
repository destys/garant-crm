import QueryString from "qs";

import { API_URL } from "@/constants";
import {
  CashboxTransactionProps,
  CashboxTransactionPropsDto,
} from "@/types/cashbox.types";

const apiUrl = `${API_URL}/api/cash-transactions`;

/** Общий обработчик ответа */
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка запроса: ${response.status} ${errorText}`);
  }
  return response.json();
};

/** Список транзакций с пагинацией/фильтрами */
export const fetchCashTransactions = async (
  token: string,
  page = 1,
  pageSize = 20,
  filterQuery = ""
): Promise<{ items: CashboxTransactionProps[]; total: number }> => {
  if (!token) throw new Error("Authentication token is missing");

  const query = QueryString.stringify(
    {
      pagination: { page, pageSize },
      sort: ["createdAt:desc"],
      populate: {
        user: { populate: "*" },
        // cashbox: { populate: "*" }, // если есть связь
      },
      ...(filterQuery && QueryString.parse(filterQuery)),
    },
    { encodeValuesOnly: true }
  );

  const res = await fetch(`${apiUrl}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await handleResponse(res);
  return {
    items: data.data as CashboxTransactionProps[],
    total: data.meta?.pagination?.total ?? 0,
  };
};

/** Одна транзакция по documentId */
export const fetchCashTransactionById = async (
  token: string,
  documentId: string
): Promise<CashboxTransactionProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const query = QueryString.stringify(
    {
      populate: {
        user: { populate: "*" },
        // cashbox: { populate: "*" },
      },
    },
    { encodeValuesOnly: true }
  );

  const res = await fetch(`${apiUrl}/${documentId}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await handleResponse(res);
  return data.data as CashboxTransactionProps;
};

/** Создать транзакцию */
export const createCashTransaction = async (
  token: string,
  payload: Partial<CashboxTransactionPropsDto>
): Promise<CashboxTransactionProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: payload }),
  });

  const data = await handleResponse(res);
  return data.data as CashboxTransactionProps;
};

/** Обновить транзакцию */
export const updateCashTransaction = async (
  token: string,
  documentId: string,
  payload: Partial<CashboxTransactionPropsDto>
): Promise<CashboxTransactionProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const res = await fetch(`${apiUrl}/${documentId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: payload }),
  });

  const data = await handleResponse(res);
  return data.data as CashboxTransactionProps;
};

/** Удалить транзакцию */
export const deleteCashTransaction = async (
  token: string,
  documentId: string
): Promise<string> => {
  if (!token) throw new Error("Authentication token is missing");

  const res = await fetch(`${apiUrl}/${documentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  await handleResponse(res);
  return documentId;
};
