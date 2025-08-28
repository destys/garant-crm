import { API_URL } from "@/constants";
import { CashboxProps } from "@/types/cashbox.types";

export const fetchCashbox = async (token: string): Promise<CashboxProps> => {
  const res = await fetch(`${API_URL}/api/cashbox?populate=*`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Не удалось загрузить кассу");
  }

  const json = await res.json();
  return (json?.data ?? {}) as CashboxProps;
};

export const updateCashbox = async (
  token: string,
  data: Partial<CashboxProps>
): Promise<CashboxProps> => {
  const res = await fetch(`${API_URL}/api/cashbox`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  });

  if (!res.ok) {
    throw new Error("Не удалось обновить кассу");
  }

  const json = await res.json();
  return (json?.data ?? {}) as CashboxProps;
};
