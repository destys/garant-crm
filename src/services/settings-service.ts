import { API_URL } from "@/constants";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const fetchSettings = async (token: string) => {
  const res = await fetch(`${API_URL}/api/setting?populate=*`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Не удалось загрузить настройки");
  }

  const json = await res.json();
  return json.data || {};
};

export const updateSettings = async (
  token: string,
  data: Partial<any> // Лучше указать точный тип
) => {
  const res = await fetch(`${API_URL}/api/setting`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  });

  if (!res.ok) {
    throw new Error("Не удалось обновить настройки");
  }

  const json = await res.json();
  return json.data || {};
};
