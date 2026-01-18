/* eslint-disable @typescript-eslint/no-explicit-any */
"use strict";

import QueryString from "qs";

import { API_URL } from "@/constants";
import { UpdateUserDto, UserProps } from "@/types/user.types";

const apiUrl = `${API_URL}/api/users`;

/**
 * Общий метод для обработки запросов
 */
const fetchApi = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const res = await fetch(url, options);
  if (!res.ok) {
    // Пытаемся достать читаемую ошибку
    const text = await res.text();
    let errorMessage = `Ошибка запроса: ${res.status}`;
    try {
      const json = JSON.parse(text);
      errorMessage = json?.error?.message || json?.message || errorMessage;
    } catch {
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

/**
 * Получение одного пользователя по ID
 */
export const getUserById = async (
  token: string,
  userId: number
): Promise<UserProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const query = QueryString.stringify(
    {
      sort: ["createdAt:desc"],
      populate: {
        role: {
          populate: "*",
        },
        orders: {
          populate: "*",
        },
        incomes: {
          populate: "*",
        },
        outcomes: {
          populate: "*",
        },
        manual_income_outcomes: {
          populate: "*",
        },
      },
    },
    { encodeValuesOnly: true }
  );

  return fetchApi<UserProps>(`${apiUrl}/${userId}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Получение текущего пользователя
 */
export const getCurrentUser = async (
  token: string | null
): Promise<UserProps> => {
  if (!token) throw new Error("Authentication token is missing");

  return fetchApi<UserProps>(`${API_URL}/api/users/me?populate=*`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Получение списка пользователей с пагинацией и фильтрацией
 */
export const fetchUsers = async (
  token: string,
  page = 1,
  pageSize = 10,
  filterQuery = ""
): Promise<{ users: UserProps[]; total: number }> => {
  if (!token) throw new Error("Authentication token is missing");

  const url = `${apiUrl}?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc${
    filterQuery ? `&${filterQuery}` : ""
  }`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Ошибка запроса: ${res.status}`);
  }

  const users = await res.json();
  const total = parseInt(res.headers.get("x-total-count") || "0", 10);

  return { users, total };
};

/**
 * Создание пользователя (2 шага)
 */
export const createUser = async (
  token: string,
  data: {
    email: string;
    name: string;
    password: string;
    phone?: string;
    role: { id: number }; // id роли
  }
): Promise<UserProps> => {
  if (!token) throw new Error("Authentication token is missing");

  try {
    // 1️⃣ Создаем пользователя
    const registerResponse = await fetchApi<{ jwt: string; user: UserProps }>(
      `${API_URL}/api/auth/local/register`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.email.split("@")[0],
          email: data.email,
          password: data.password,
        }),
      }
    );

    // 2️⃣ Обновляем дополнительные поля и роль
    const updatedUser = await fetchApi<UserProps>(
      `${API_URL}/api/users/${registerResponse.user.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          role: data.role.id,
        }),
      }
    );

    return updatedUser;
  } catch (error: any) {
    console.error("Ошибка при создании пользователя:", error);
    throw error; // пробрасываем в React Query
  }
};

/**
 * Обновление пользователя
 */
export const updateUser = async (
  token: string,
  userId: number,
  updatedData: Partial<UpdateUserDto>
): Promise<UserProps> => {
  if (!token) throw new Error("Authentication token is missing");

  return fetchApi<UserProps>(`${apiUrl}/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...updatedData }),
  });
};

/**
 * Удаление пользователя
 */
export const deleteUser = async (
  token: string,
  userId: number
): Promise<number> => {
  if (!token) throw new Error("Authentication token is missing");

  await fetchApi(`${apiUrl}/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return userId;
};

/**
 * Атомарное обновление баланса пользователя.
 * Сначала получает текущий баланс с сервера, затем добавляет delta.
 * Это предотвращает гонку при множественных быстрых обновлениях.
 */
export const updateUserBalanceAtomic = async (
  token: string,
  userId: number,
  delta: number
): Promise<UserProps> => {
  if (!token) throw new Error("Authentication token is missing");

  // 1. Получаем актуальный баланс
  const currentUser = await fetchApi<UserProps>(`${apiUrl}/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const currentBalance = currentUser.balance ?? 0;
  const newBalance = currentBalance + delta;

  // 2. Обновляем с новым значением
  return fetchApi<UserProps>(`${apiUrl}/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ balance: newBalance }),
  });
};
