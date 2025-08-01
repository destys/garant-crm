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

import { AuthProvider } from './auth-provider'
import { ModalProvider } from './modal-provider'

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
                            incomeOutcome: AddIncomeOutcomeModal,
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