"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { DEMO_DATA } from "@/constants"
import { useAuth } from "@/providers/auth-provider";

export default function Page() {
  const { user } = useAuth()
  console.log('user: ', user);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable data={DEMO_DATA} />
        </div>
      </div>
    </div>
  )
}
