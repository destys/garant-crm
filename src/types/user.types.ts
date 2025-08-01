import { IncomeOutcomeProps } from "./income-outcome.types";
import { OrderProps } from "./order.types";

export interface UserProps {
  id: number;
  balance: number;
  name: string;
  phone: string;
  orders: OrderProps[];
  blocked: boolean;
  email: string;
  role: {
    id: number;
  };
  incomes: IncomeOutcomeProps[];
  outcomes: IncomeOutcomeProps[];
}

export type UpdateUserDto = Omit<UserProps, "role"> & {
  role?: number;
};
