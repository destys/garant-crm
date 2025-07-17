import React from 'react'
import { Link2Icon, PhoneIcon } from 'lucide-react'
import Link from 'next/link'

import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const OrderClient = () => {
    return (
        <Card className="mt-6 md:max-w-1/2">
            <CardHeader>
                <CardTitle>Иванов Иван Иванович</CardTitle>
                <CardAction className='space-x-4'>
                    <Button>
                        <PhoneIcon />
                    </Button>
                    <Button variant={'secondary'} asChild>
                        <Link href={'/clients/asdjijhuh12312i'} target='_blank'>
                            <Link2Icon />
                        </Link>
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                ул. Пушкина
            </CardContent>
        </Card>
    )
}
