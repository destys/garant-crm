export interface OrderProps {
  order_number: string;
  order_status: string;
  departure_date: string;
  deadline: string;
  device: {
    type: string;
    brand: string;
    model: string;
  };
  payment: {
    prepay: string;
    total: string;
  };
  masters: {
    id: number;
    name: string;
  }[];
}
