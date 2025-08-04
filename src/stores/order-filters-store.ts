import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Filters {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface OrderFilterState {
  filters: Filters;
  activeTitle: string | null;
  setFilters: (filters: Filters) => void;
  resetFilters: () => void;
  setActiveTitle: (title: string | null) => void;
}

export const useOrderFilterStore = create<OrderFilterState>()(
  persist(
    (set) => ({
      filters: {},
      activeTitle: null,
      setFilters: (filters) =>
        set({
          filters, // 🔄 перезаписываем полностью
        }),
      resetFilters: () =>
        set({
          filters: {},
          activeTitle: null,
        }),
      setActiveTitle: (title) => set({ activeTitle: title }),
    }),
    {
      name: "order-filters", // ключ в sessionStorage
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);
