"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";
import { Toaster } from "sonner";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AddUserModal } from "@/components/modals/add-user-modal";
import { AddIncomeOutcomeModal } from "@/components/modals/add-income-outcome-modal";
import { AddClientModal } from "@/components/modals/add-client";
import { AddMasterManualIncomeOutcome } from "@/components/modals/add-master-manual-income-outcome";
import { AddCashboxTransactionModal } from "@/components/modals/add-cashbox-transaction-modal";
import { ShiftBalanceModal } from "@/components/modals/shift-balance-modal";

import { AuthProvider } from "./auth-provider";
import { ModalComponent, ModalProvider } from "./modal-provider";

// ============================================================================
// 🚀 ОПТИМИЗИРОВАННЫЕ НАСТРОЙКИ REACT QUERY
// ============================================================================
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Данные считаются свежими 60 секунд — не будет лишних запросов
        staleTime: 1000 * 60,
        // Кэш хранится 10 минут после последнего использования
        gcTime: 1000 * 60 * 10,
        // Отключаем автоматический refetch при фокусе окна
        refetchOnWindowFocus: false,
        // Отключаем refetch при переподключении к сети
        refetchOnReconnect: false,
        // Не делать retry при ошибках (ускоряет отклик)
        retry: 1,
        // Показывать предыдущие данные пока загружаются новые
        placeholderData: (prev: unknown) => prev,
      },
      mutations: {
        // Быстрый отклик на мутации
        retry: 0,
      },
    },
  });

export const Providers = ({ children }: { children: ReactNode }) => {
  const [client] = useState(createQueryClient);

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <ModalProvider
            modals={{
              addUser: AddUserModal,
              addClient: AddClientModal,
              addTransaction: AddCashboxTransactionModal,
              shiftBalance: ShiftBalanceModal,
              incomeOutcome: AddIncomeOutcomeModal as ModalComponent<{
                type: "income" | "outcome";
                orderId: string;
                masterId: number;
              }>,
              manualIncomeOutcome:
                AddMasterManualIncomeOutcome as ModalComponent<{
                  type: "income" | "outcome";
                  orderId: string;
                  masterId: number;
                }>,
            }}
          >
            <AppSidebar variant="inset" />
            <SidebarInset>
              <SiteHeader />
              {children}
              <Toaster />
            </SidebarInset>
          </ModalProvider>
        </SidebarProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
