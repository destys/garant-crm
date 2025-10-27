"use client";
import { useState } from "react";
import { startOfMonth, endOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { StatsTiles } from "@/components/reports/stats-tiles";
import { RejectionCharts } from "@/components/reports/rejection-charts";
import { IncomeExpenseChart } from "@/components/reports/income-expense-chart";
import { MasterIncomeChart } from "@/components/reports/master-income-chart-new";
import { MasterReport } from "@/components/reports/master-report";
import { DateShortcuts } from "@/components/reports/date-shortcuts";
import { ServiceReport } from "@/components/reports/service-report";

export const ReportsContent = () => {
  const [range, setRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Отчеты и статистика</h1>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:max-w-sm">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !range?.from && !range?.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {range?.from ? (
                  range.to ? (
                    `${format(range.from, "dd.MM.yyyy")} – ${format(
                      range.to,
                      "dd.MM.yyyy"
                    )}`
                  ) : (
                    format(range.from, "dd.MM.yyyy")
                  )
                ) : (
                  <span>Выберите даты</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                defaultMonth={range?.from ?? new Date()}
                numberOfMonths={2}
                className="rounded-lg border shadow-sm"
                required
              />
            </PopoverContent>
          </Popover>
        </div>

        <DateShortcuts setRange={setRange} />
      </div>

      <StatsTiles range={range} />
      <RejectionCharts range={range} />
      <IncomeExpenseChart range={range} />
      <MasterIncomeChart range={range} />
      <MasterReport range={range} />
      <ServiceReport range={range} />
    </div>
  );
};
