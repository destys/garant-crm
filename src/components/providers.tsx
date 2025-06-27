'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useState, createContext, useContext, useEffect } from 'react'

import { SidebarProvider } from '@/components/ui/sidebar'

// Auth context
interface AuthContextType {
    role: string | null
}
const AuthContext = createContext<AuthContextType>({ role: null })

export function useAuth() {
    return useContext(AuthContext)
}

function getRoleFromCookie() {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(/user_role=([^;]+)/)
    return match ? decodeURIComponent(match[1]) : null
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [role, setRole] = useState<string | null>(null)
    useEffect(() => {
        setRole(getRoleFromCookie())
    }, [])
    return <AuthContext.Provider value={{ role }}>{children}</AuthContext.Provider>
}

export const Providers = ({ children }: { children: ReactNode }) => {
    const [client] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={client}>
            <SidebarProvider>
                <AuthProvider>{children}</AuthProvider>
            </SidebarProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}