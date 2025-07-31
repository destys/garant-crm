"use strict";

import { API_URL } from "@/constants";
import { UserProps } from "@/types/user.types";

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
    const error = await res.text();
    throw new Error(error || `Ошибка запроса: ${res.status}`);
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

  return fetchApi<UserProps>(`${apiUrl}/${userId}?populate=*`, {
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
    throw new Error(`Ошибка запроса: ${res.status}`);
  }

  const users = await res.json();
  const total = parseInt(res.headers.get("x-total-count") || "0", 10);

  return { users, total };
};

/**
 * Создание пользователя (только для админов!)
 */
export const createUser = async (
  token: string,
  userData: Partial<UserProps>
): Promise<UserProps> => {
  if (!token) throw new Error("Authentication token is missing");

  return fetchApi<UserProps>(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
};

/**
 * Обновление пользователя
 */
export const updateUser = async (
  token: string,
  userId: number,
  updatedData: Partial<UserProps>
): Promise<UserProps> => {
  if (!token) throw new Error("Authentication token is missing");

  return fetchApi<UserProps>(`${apiUrl}/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedData),
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
