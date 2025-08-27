import QueryString from "qs";

import { API_URL } from "@/constants";
import { OrderProps } from "@/types/order.types";

const apiUrl = `${API_URL}/api/orders`;

/**
 * Универсальная обработка ответа
 */
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка запроса: ${response.status} ${errorText}`);
  }
  return response.json();
};

/**
 * Получение списка заказов с фильтрацией и пагинацией
 */
export const fetchOrders = async (
  token: string,
  page = 1,
  pageSize = 10,
  filterQuery: string = ""
): Promise<{ orders: OrderProps[]; total: number }> => {
  if (!token) throw new Error("Authentication token is missing");

  const query = QueryString.stringify(
    {
      pagination: {
        page,
        pageSize,
      },
      sort: ["createdAt:desc"],
      populate: {
        incomes: { populate: "*" },
        outcomes: { populate: "*" },
        master: { populate: "*" },
        order_docs: { populate: "*" },
        device_photos: { populate: "*" },
        client: { populate: "*" },
        chat: { populate: "*" },
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
    orders: data.data,
    total: data.meta?.pagination?.total ?? 0,
  };
};

/**
 * Получение одного заказа по documentId
 */
export const fetchOrderById = async (
  token: string,
  documentId: string
): Promise<OrderProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const query = QueryString.stringify(
    {
      populate: {
        incomes: { populate: "*" },
        outcomes: { populate: "*" },
        master: { populate: "*" },
        order_docs: { populate: "*" },
        device_photos: { populate: "*" },
        client: { populate: "*" },
        chat: { populate: "*" },
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

/**
 * Создание заказа
 */
export const createOrder = async (
  token: string,
  order: Partial<OrderProps>
): Promise<OrderProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: order }),
  });

  const data = await handleResponse(response);
  return data.data;
};

/**
 * Обновление заказа
 */
export const updateOrder = async (
  token: string,
  documentId: string,
  updatedData: Partial<OrderProps>
): Promise<OrderProps> => {
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

/**
 * Удаление заказа
 */
export const deleteOrder = async (
  token: string,
  documentId: string
): Promise<string> => {
  if (!token) throw new Error("Authentication token is missing");

  const response = await fetch(`${apiUrl}/${documentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await handleResponse(response);
  return documentId;
};
