import { ClientProps } from "./client.types";
import { IncomeOutcomeProps } from "./income-outcome.types";
import { MediaProps } from "./media.types";
import { UserProps } from "./user.types";

export interface OrderProps {
  title: string;
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
  client: ClientProps;
  order_docs: MediaProps[];
  device_photos: MediaProps[];
  incomes: IncomeOutcomeProps[];
  outcomes: IncomeOutcomeProps[];
  master: Partial<UserProps>;
}
