import { MailIcon, PhoneCallIcon, PrinterIcon } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { OrderProps } from '@/types/order.types'
import { Button } from "@/components/ui/button"

import { generateActPdf } from "../pdfs/generate-act-pdf"
import { generateTechnicalConclusionPdf } from "../pdfs/generate-technical-conclusion-pdf"
import { generateWarrantyPdf } from "../pdfs/generate-warranty-pdf"

export const OrderDocs = ({ data }: { data: OrderProps }) => {
    return (
        <div className="flex gap-2">
            <Button>
                <PhoneCallIcon />
            </Button>
            <Button>
                <MailIcon />
            </Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button>
                        <PrinterIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="grid gap-4">
                    <Button variant={'secondary'}>Договор</Button>
                    <Button variant={'secondary'} onClick={() => generateActPdf(data)}>Акт</Button>
                    <Button variant={'secondary'} onClick={() => generateWarrantyPdf(data)}>Гарантия</Button>
                    <Button variant={'secondary'} onClick={() => generateTechnicalConclusionPdf(data)}>Техническое заключение</Button>
                </PopoverContent>
            </Popover>
        </div>
    )
}
