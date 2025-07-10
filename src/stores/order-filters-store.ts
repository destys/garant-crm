import { create } from "zustand";

type Filter = Record<string, unknown>;

interface OrderFilterState {
  filters: Filter | null;
  setFilters: (filters: Filter | null) => void;
  activeTitle: string | null;
  setActiveTitle: (title: string | null) => void;
}

export const useOrderFilterStore = create<OrderFilterState>((set) => ({
  filters: null,
  activeTitle: null,
  setFilters: (filters) => set({ filters }),
  setActiveTitle: (title) => set({ activeTitle: title }),
}));
