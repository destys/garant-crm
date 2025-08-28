import { IncomeOutcomeProps } from "./income-outcome.types";
import { ManualIncomeOutcomeProps } from "./manual-io.types";
import { OrderProps } from "./order.types";

export interface UserProps {
  id: number;
  balance: number;
  name: string;
  phone: string;
  orders: OrderProps[];
  blocked: boolean;
  email: string;
  position: string;
  password: string;
  role: {
    id: number;
  };
  incomes: IncomeOutcomeProps[];
  outcomes: IncomeOutcomeProps[];
  manual_income_outcomes: ManualIncomeOutcomeProps;
}

export type UpdateUserOnlyId = Omit<UserProps, "role"> & {
  role?: number;
};

export type UpdateUserDto = Omit<UserProps, "role"> & {
  role?: number;
};
