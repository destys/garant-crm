import { MediaProps } from "./media.types";
import { OrderProps } from "./order.types";
import { UserProps } from "./user.types";

export interface IncomeOutcomeProps {
  id: number;
  documentId: string;
  createdAt: string;
  note: string;
  type: string;
  count: number;
  user: Partial<UserProps>;
  order: Partial<OrderProps>;
  outcome_category: string;
  income_category: string;
  author: string;
  isApproved: boolean;
  photo: MediaProps;
}

export type UpdateIncomeOutcomeDto = Omit<IncomeOutcomeProps, "user, order"> & {
  user?: number;
  order?: string;
};
