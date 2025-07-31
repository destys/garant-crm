import { create } from "zustand";

interface DateRange {
  from?: Date;
  to?: Date;
}

interface Filters {
  search?: string;
  dateRange?: DateRange;
  master?: string;
}

interface OrderFilterState {
  filters: Filters;
  activeTitle: string | null;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  setActiveTitle: (title: string | null) => void;
}

export const useOrderFilterStore = create<OrderFilterState>((set) => ({
  filters: {},
  activeTitle: null,
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  resetFilters: () =>
    set({
      filters: {},
    }),
  setActiveTitle: (title) => set({ activeTitle: title }),
}));
