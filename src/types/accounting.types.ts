export interface AccountingIncome {
  id: number;
  date: string; // ISO или DD.MM.YYYY
  amount: number;
  description: string;
  orderId?: string; // номер заказа, если есть связь
  masterId?: number;
}

export interface AccountingExpense {
  id: number;
  date: string;
  amount: number;
  description: string;
  orderId?: string;
  masterId?: number;
}
