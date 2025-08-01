/* eslint-disable @typescript-eslint/no-explicit-any */
"use strict";

import { API_URL } from "@/constants";
import {
  IncomeOutcomeProps,
  UpdateIncomeOutcomeDto,
} from "@/types/income-outcome.types";

const apiUrl = `${API_URL}/api/incomes`;

// универсальная обработка fetch
const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Request failed: ${res.status} - ${errorText}`);
  }
  return res.json();
};

export const fetchIncomes = async (
  token: string,
  page = 1,
  pageSize = 10,
  filterQuery = ""
): Promise<{ incomes: IncomeOutcomeProps[]; total: number }> => {
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
    incomes: data.data,
    total: data.meta?.pagination?.total ?? 0,
  };
};

export const fetchIncomeById = async (
  token: string,
  documentId: string
): Promise<IncomeOutcomeProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const res = await fetch(`${apiUrl}/${documentId}?populate=*`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await handleResponse<any>(res);
  return data.data;
};

export const createIncome = async (
  token: string,
  incomeData: Partial<UpdateIncomeOutcomeDto>
): Promise<IncomeOutcomeProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: incomeData }),
  });

  const data = await handleResponse<any>(res);
  return data.data;
};

export const updateIncome = async (
  token: string,
  documentId: string,
  updatedData: Partial<IncomeOutcomeProps>
): Promise<IncomeOutcomeProps> => {
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

export const deleteIncome = async (
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
