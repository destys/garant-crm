/* eslint-disable @typescript-eslint/no-explicit-any */
"use strict";

import { API_URL } from "@/constants";
import {
  IncomeOutcomeProps,
  UpdateIncomeOutcomeDto,
} from "@/types/income-outcome.types";

const apiUrl = `${API_URL}/api/outcomes`;

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Request failed: ${res.status} ${errorText}`);
  }
  return res.json();
};

export const fetchOutcomes = async (
  token: string,
  page = 1,
  pageSize = 100,
  filterQuery: string = ""
): Promise<{ outcomes: IncomeOutcomeProps[]; total: number }> => {
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
    outcomes: data.data,
    total: data.meta?.pagination?.total ?? 0,
  };
};

export const fetchExpenseById = async (
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

export const createExpense = async (
  token: string,
  expenseData: Partial<UpdateIncomeOutcomeDto>
): Promise<IncomeOutcomeProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: expenseData }),
  });

  const data = await handleResponse<any>(res);
  return data.data;
};

export const updateExpense = async (
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

export const deleteExpense = async (
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
