import { UserProps } from "./user.types";

export interface CashboxProps {
  balance: number;
}

export interface CashboxTransactionProps {
  documentId: string;
  type: string;
  amount: number;
  user: UserProps;
  comment: string;
  createdAt: string;
}

export type CashboxTransactionPropsDto = Omit<
  CashboxTransactionProps,
  "user"
> & {
  user: { id: number };
};
