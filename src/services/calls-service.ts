import QueryString from "qs";

import { API_URL } from "@/constants";
import { CallProps, UnknownCallProps } from "@/types/call.types";
import { MetaProps } from "@/types/meta.types";

const apiUrl = `${API_URL}/api/calls`;
const unknownCallsUrl = `${API_URL}/api/unknown-calls`;

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка запроса: ${response.status} ${errorText}`);
  }
  return response.json();
};

export const fetchCalls = async (
  token: string,
  page = 1,
  pageSize = 25,
  filterQuery = ""
): Promise<{ calls: CallProps[]; total: number; meta: MetaProps }> => {
  if (!token) throw new Error("Authentication token is missing");

  const query = QueryString.stringify(
    {
      pagination: { page, pageSize },
      sort: ["createdAt:desc"],
      populate: {
        client: { populate: "*" },
        order: { populate: "*" },
        recording: { populate: "*" },
        unknown_call: { populate: "*" },
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
    calls: data.data,
    meta: data.meta,
    total: data.meta?.pagination?.total ?? 0,
  };
};

export const fetchCallsByClient = async (
  token: string,
  clientPhone: string,
  page = 1,
  pageSize = 50
): Promise<{ calls: CallProps[]; total: number; meta: MetaProps }> => {
  if (!token) throw new Error("Authentication token is missing");

  const normalizedPhone = clientPhone.replace(/\D/g, "");

  const query = QueryString.stringify(
    {
      pagination: { page, pageSize },
      sort: ["createdAt:desc"],
      filters: {
        $or: [
          { fromNumber: { $contains: normalizedPhone } },
          { toNumber: { $contains: normalizedPhone } },
        ],
      },
      populate: {
        client: { populate: "*" },
        order: { populate: "*" },
        recording: { populate: "*" },
        unknown_call: { populate: "*" },
      },
    },
    { encodeValuesOnly: true }
  );

  const response = await fetch(`${apiUrl}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await handleResponse(response);

  return {
    calls: data.data,
    meta: data.meta,
    total: data.meta?.pagination?.total ?? 0,
  };
};

export const fetchCallById = async (
  token: string,
  documentId: string
): Promise<CallProps> => {
  if (!token) throw new Error("Authentication token is missing");

  const query = QueryString.stringify(
    {
      populate: {
        client: { populate: "*" },
        order: { populate: "*" },
        recording: { populate: "*" },
        unknown_call: { populate: "*" },
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

export const updateCall = async (
  token: string,
  documentId: string,
  updatedData: Partial<CallProps>
): Promise<CallProps> => {
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

export const deleteCall = async (
  token: string,
  documentId: string
): Promise<string> => {
  if (!token) throw new Error("Authentication token is missing");

  const response = await fetch(`${apiUrl}/${documentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  await handleResponse(response);
  return documentId;
};

// Unknown Calls
export const fetchUnknownCalls = async (
  token: string,
  page = 1,
  pageSize = 25,
  filterQuery = ""
): Promise<{ calls: UnknownCallProps[]; total: number; meta: MetaProps }> => {
  if (!token) throw new Error("Authentication token is missing");

  const query = QueryString.stringify(
    {
      pagination: { page, pageSize },
      sort: ["lastCallAt:desc"],
      populate: {
        calls: { populate: "*" },
      },
      ...(filterQuery && QueryString.parse(filterQuery)),
    },
    { encodeValuesOnly: true }
  );

  const response = await fetch(`${unknownCallsUrl}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await handleResponse(response);

  return {
    calls: data.data,
    meta: data.meta,
    total: data.meta?.pagination?.total ?? 0,
  };
};

export const deleteUnknownCall = async (
  token: string,
  documentId: string
): Promise<string> => {
  if (!token) throw new Error("Authentication token is missing");

  const response = await fetch(`${unknownCallsUrl}/${documentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  await handleResponse(response);
  return documentId;
};

// Get recording URL from Mango Office via Next.js API route
export const fetchRecordingUrl = async (
  recordingId: string
): Promise<string> => {
  const response = await fetch(
    `/api/mango/recording/${encodeURIComponent(recordingId)}`
  );

  const contentType = response.headers.get("Content-Type");

  if (!response.ok || !contentType?.includes("audio")) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch recording");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
