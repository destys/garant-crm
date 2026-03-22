import { ClientProps } from "./client.types";
import { OrderProps } from "./order.types";
import { UserProps } from "./user.types";

export interface SmsLogProps {
  id: number;
  documentId: string;
  commandId: string;
  phone: string;
  text: string;
  smsStatus: string;
  reason: string | null;
  sentAt: string;
  deliveredAt: string | null;
  rawPayload: Record<string, unknown> | null;
  order: Partial<OrderProps> | null;
  client: Partial<ClientProps> | null;
  user: Partial<UserProps> | null;
  createdAt: string;
}

export interface SendSmsDto {
  phone: string;
  text: string;
  orderId?: number;
  clientId?: number;
}
