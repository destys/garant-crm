import { create } from "zustand";
import { persist } from "zustand/middleware";

type ViewMode = "table" | "card";

type TableViewStore = {
  views: Record<string, ViewMode>;
  setView: (key: string, mode: ViewMode) => void;
};

export const useTableViewStore = create<TableViewStore>()(
  persist(
    (set) => ({
      views: {},
      setView: (key, mode) =>
        set((state) => ({
          views: {
            ...state.views,
            [key]: mode,
          },
        })),
    }),
    {
      name: "table-view-store", // ключ в localStorage
    }
  )
);
