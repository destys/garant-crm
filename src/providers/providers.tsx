'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useState } from 'react'

import { SidebarProvider } from '@/components/ui/sidebar'

import { AuthProvider } from './auth-provider'

export const Providers = ({ children }: { children: ReactNode }) => {
    const [client] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={client}>
            <AuthProvider>
                <SidebarProvider>
                    {children}
                </SidebarProvider>
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}