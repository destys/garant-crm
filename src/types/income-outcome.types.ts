import { OrderProps } from "./order.types";
import { UserProps } from "./user.types";

export interface IncomeOutcomeProps {
  id: number;
  documentId: string;
  createdAt: string;
  note: string;
  count: number;
  user: UserProps;
  order: OrderProps;
}
