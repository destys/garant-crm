'use client';


import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import RepairOrderForm from "@/components/orders/order-form"
import { useUsers } from "@/hooks/use-users";

const NewOrderPage = () => {
    const { users } = useUsers(1, 100);

    const handleSelectMaster = (value: string) => {
        console.warn('value: ', value);

    }

    return (
        <div>
            <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-4 mb-8">
                <h1 className="flex-auto">Новая заявка</h1>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-2">

                    </div>
                    <div className="flex items-center gap-4">
                        <span>Мастер:</span>
                        <Select onValueChange={handleSelectMaster}>
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
            <RepairOrderForm />
        </div>
    )
}

export default NewOrderPage