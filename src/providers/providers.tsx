'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useState } from 'react'
import { Toaster } from 'sonner'

import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { SiteHeader } from '@/components/site-header'
import { AppSidebar } from '@/components/app-sidebar'
import { AddUserModal } from '@/components/modals/add-user-modal'
import { AddIncomeOutcomeModal } from '@/components/modals/add-income-outcome-modal'
import { AddClientModal } from '@/components/modals/add-client'

import { AuthProvider } from './auth-provider'
import { ModalComponent, ModalProvider } from './modal-provider'

export const Providers = ({ children }: { children: ReactNode }) => {
    const [client] = useState(() => new QueryClient())

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
                            incomeOutcome: AddIncomeOutcomeModal as ModalComponent<{
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
        </QueryClientProvider >
    )
}