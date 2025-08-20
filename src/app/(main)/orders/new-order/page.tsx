'use client';

import { useState } from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUsers } from "@/hooks/use-users"
import { useClients } from "@/hooks/use-clients"
import { RepairOrderForm } from "@/components/orders/order-form"
import { ClientProps } from "@/types/client.types";
import { AddClientModal } from "@/components/modals/add-client";
import { Separator } from "@/components/ui/separator";

const NewOrderPage = () => {
    const { users } = useUsers(1, 100)
    const { clients, createClient } = useClients(1, 100)

    const [phone, setPhone] = useState("")
    const [client, setClient] = useState<ClientProps | null>(null)
    const [clientId, setClientId] = useState<string | null>(null)
    const [masterId, setMasterId] = useState<string>("")
    const [loadingClient, setLoadingClient] = useState(false)

    const handleFindOrCreateClient = () => {
        if (!phone.trim()) return

        setLoadingClient(true)
        const existing = clients.find(c => c.phone?.replace(/\D/g, "") === phone.replace(/\D/g, ""))

        if (existing) {
            setClient(existing)
            setClientId(existing.documentId)
            setLoadingClient(false)
        } else {
            createClient({ phone }, {
                onSuccess: (created) => {
                    setClient(created)
                    setClientId(created.documentId)
                    setLoadingClient(false)
                },
                onError: () => {
                    setLoadingClient(false)
                }
            })
        }
    }

    return (
        <div>
            <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-4 mb-8">
                <h1 className="flex-auto">Новая заявка</h1>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <span>Мастер:</span>
                        <Select onValueChange={(value) => setMasterId(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Выбрать" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((master) => (
                                    <SelectItem key={master.id} value={master.id.toString()}>
                                        {master.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="mb-6 flex gap-4 items-end">
                <div className="flex flex-col gap-2">
                    <label className="text-sm">Номер телефона клиента</label>
                    <Input
                        mask="+0 000 000 00-00"
                        placeholder="Введите номер"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={loadingClient}
                    />
                </div>
                <Button onClick={handleFindOrCreateClient} disabled={loadingClient || !phone}>Привязать</Button>
            </div>

            {clientId && (
                <>
                    {client && (
                        <div className="space-y-4">
                            <div className="max-w-3xl border rounded-2xl p-4">
                                <h3 className="mb-4 font-bold text-xl">Данные клиента</h3>
                                <AddClientModal close={() => undefined} props={{ client: client }} />
                            </div>
                            <Separator />
                        </div>

                    )}

                    <RepairOrderForm clientDocumentId={clientId} masterId={masterId} />
                </>

            )}
        </div>
    )
}

export default NewOrderPage
