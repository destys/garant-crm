import { DataTable } from "@/components/data-table"
import { ordersColumns } from "@/components/orders/orders-columns"
import { SectionCards } from "@/components/section-cards"
import { demoOrders } from "@/demo-data"

export default function Page() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SectionCards />
      <DataTable data={demoOrders} columns={ordersColumns} />
    </div>
  )
}
