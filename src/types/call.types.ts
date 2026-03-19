import { ClientProps } from "./client.types";
import { MediaProps } from "./media.types";
import { OrderProps } from "./order.types";

export interface CallProps {
  id: number;
  documentId: string;
  mangoEntryId: string;
  mangoCallId: string;
  direction: "inbound" | "outbound";
  fromNumber: string;
  toNumber: string;
  startedAt: string;
  endedAt: string;
  duration: number;
  callStatus: string;
  recordingId: string;
  recording: MediaProps | null;
  rawPayload: Record<string, unknown>;
  isKnownClient: boolean;
  seen: boolean;
  client: Partial<ClientProps> | null;
  order: Partial<OrderProps> | null;
  unknown_call: UnknownCallProps | null;
  createdAt: string;
}

export interface UnknownCallProps {
  id: number;
  documentId: string;
  phone: string;
  firstCallAt: string;
  lastCallAt: string;
  callsCount: number;
  calls: CallProps[];
}
