import { ClientProps } from "./client.types";
import { IncomeOutcomeProps } from "./income-outcome.types";
import { MediaProps } from "./media.types";
import { UserProps } from "./user.types";

export interface OrderProps {
  id: number;
  title: string;
  createdAt: string;
  author: string;
  documentId: string;
  orderStatus: string;
  device_type: string;
  brand: string;
  model: string;
  departure_date: string;
  deadline: string;
  source: string;
  warranty: string;
  type_of_repair: string;
  kind_of_repair: string;
  visit_date: string;
  diagnostic_date: string;
  date_of_issue: string;
  serial_number: string;
  reason_for_refusal: string;
  defect: string;
  conclusion: string;
  total_cost: string;
  prepay: string;
  equipment: string;
  completed_work: string;
  note: string;
  is_revision: boolean;
  is_approve: boolean;
  add_address: string;
  add_phone: string;
  legal_status: string;
  refusal_comment: string;
  isNeedReceipt: boolean;
  chat: {
    user: { id: number; name: string };
    datetime: string;
    message: string;
  }[];
  client: Partial<ClientProps>;
  order_docs: MediaProps[];
  order_receipts: MediaProps[];
  device_photos: MediaProps[];
  device_photos_site: MediaProps[];
  incomes: IncomeOutcomeProps[];
  outcomes: IncomeOutcomeProps[];
  master: Partial<UserProps>;
}

export type CreateOrderDto = Omit<OrderProps, "user, order"> & {
  master?: number;
  client?: string;
};
