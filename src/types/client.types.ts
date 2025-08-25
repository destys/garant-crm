import { OrderProps } from "./order.types";

export interface ClientProps {
  id: number;
  documentId: string;
  phone: string;
  address: string;
  orders: OrderProps[];
  name: string;
  rating: number;
}

export type UpdateClientDto = Omit<ClientProps, "user, order"> & {
  user?: number;
  order?: string;
  client?: string;
};
