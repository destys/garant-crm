export interface SettingsProps {
  types_of_equipment: {
    id?: number;
    title: string;
  }[];
  reasons_for_refusal: {
    id?: number;
    title: string;
  }[];
  income_categories: {
    id?: number;
    title: string;
  }[];
  outcome_categories: {
    id?: number;
    title: string;
  }[];
}
