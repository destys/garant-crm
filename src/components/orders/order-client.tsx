import React from 'react'
import { EditIcon, Link2Icon, PhoneIcon } from 'lucide-react'
import Link from 'next/link'

import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OrderProps } from '@/types/order.types'
import { useModal } from '@/providers/modal-provider'

import { RatingStars } from '../rating-stars'

interface Props {
    data: OrderProps;
}

export const OrderClient = ({ data }: Props) => {
    const { openModal } = useModal();
    const client = data.client;
    return (
        <Card className="mt-6 md:max-w-1/2">
            <CardHeader>
                <CardTitle>{client.name || "Имя не указано"}</CardTitle>
                <CardAction className='space-x-4'>
                    <Button asChild>
                        <Link href={`tel:${client.phone}`}>
                            <PhoneIcon />
                        </Link>
                    </Button>
                    <Button variant={'secondary'}
                        onClick={() =>
                            openModal("addClient", { title: "Редактировать клиента клиента", props: { orderId: data.documentId, client: client } })
                        }
                    >
                        <EditIcon />
                    </Button>
                    <Button variant={'secondary'} asChild>
                        <Link href={`/clients/${client.documentId}`} target='_blank'>
                            <Link2Icon />
                        </Link>
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                <div className='flex justify-between'>
                    {client.address || "Адрес не указан"}
                    <RatingStars value={client.rating} />
                </div>
            </CardContent>
        </Card>
    )
}
