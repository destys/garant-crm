/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ManualIncomeOutcomeProps {
  id: number;
  documentId: string;
  count: number;
  agent?: string | null;
  note?: string | null;
  type: string;
  createdAt: string;
  createdDate: string;
  user: any;
}
