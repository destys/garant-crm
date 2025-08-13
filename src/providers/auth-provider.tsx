'use client'

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useMemo,
} from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { UserProps } from '@/types/user.types'

interface AuthContextType {
    role: string | null
    roleId: number | null
    jwt: string | null
    user: UserProps | null
    isAuthenticated: boolean
    isMaster: boolean
    isManager: boolean
    isAdmin: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType>({
    role: null,
    roleId: null,
    jwt: null,
    user: null,
    isAuthenticated: false,
    isMaster: false,
    isManager: false,
    isAdmin: false,
    login: async () => { },
    logout: () => { },
})

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp(`${name}=([^;]+)`))
    return match ? decodeURIComponent(match[1]) : null
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [jwt, setJwt] = useState<string | null>(null)
    const [role, setRole] = useState<string | null>(null)
    const [roleId, setRoleId] = useState<number | null>(null)
    const [user, setUser] = useState<UserProps | null>(null)

    const router = useRouter()
    const queryClient = useQueryClient()

    // Инициализация из кук
    useEffect(() => {
        setJwt(getCookie('garant_token'))
        setRole(getCookie('user_role'))
        const id = getCookie('user_role_id')
        setRoleId(id ? Number(id) : null)
    }, [])

    // Если есть jwt — подтягиваем пользователя с сервера (после F5 или новой вкладки)
    useEffect(() => {
        let aborted = false
        async function loadMe() {
            if (!jwt) return
            try {
                const res = await fetch('/api/me', { cache: 'no-store' })
                if (!res.ok) return
                const data = await res.json()
                if (aborted) return
                if (data?.user) setUser(data.user)
                if (data?.role) setRole(data.role)
                if (data?.roleId != null) setRoleId(data.roleId)
            } catch (e) {
                console.warn('loadMe error:', e)
            }
        }
        loadMe()
        return () => { aborted = true }
    }, [jwt])

    const loginMutation = useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data?.message || 'Ошибка авторизации')
            }
            return res.json()
        },
        onSuccess: (data) => {
            // сразу кладём всё из ответа
            setJwt(getCookie('garant_token'))
            setRole(data.role ?? getCookie('user_role'))
            setRoleId(data.roleId ?? Number(getCookie('user_role_id')))
            setUser(data.user ?? null)
            queryClient.invalidateQueries()
        },
    })

    const login = async (email: string, password: string) => {
        await loginMutation.mutateAsync({ email, password })
    }

    const logout = async () => {
        await fetch('/api/logout', { method: 'POST' })
        setJwt(null)
        setRole(null)
        setRoleId(null)
        setUser(null)
        queryClient.invalidateQueries()
        router.push('/login')
    }

    const value = useMemo<AuthContextType>(
        () => ({
            role,
            roleId,
            jwt,
            user,
            isAuthenticated: !!jwt,
            isMaster: roleId === 1,
            isManager: roleId === 4,
            isAdmin: roleId === 3,
            login,
            logout,
        }),
        [role, roleId, jwt, user]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    return useContext(AuthContext)
}