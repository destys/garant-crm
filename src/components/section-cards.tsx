import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { subMonths, startOfMonth, endOfMonth } from "date-fns"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useOrders } from "@/hooks/use-orders"
import { useClients } from "@/hooks/use-clients"
import { useIncomes } from "@/hooks/use-incomes"
import { useOutcomes } from "@/hooks/use-outcomes"

const compareValues = (current: number, prev: number) => {
  if (prev === 0) return { diff: current, percent: 100, trend: 'up' }
  const diff = current - prev
  const percent = Math.abs((diff / prev) * 100).toFixed(1)
  return {
    diff,
    percent,
    trend: diff >= 0 ? 'up' : 'down',
  }
}

export function SectionCards() {
  const today = new Date()
  const prevMonth = subMonths(today, 1)

  const currentRange = {
    $gte: startOfMonth(today).toISOString(),
    $lte: endOfMonth(today).toISOString(),
  }
  const prevRange = {
    $gte: startOfMonth(prevMonth).toISOString(),
    $lte: endOfMonth(prevMonth).toISOString(),
  }

  const { data: currentOrders } = useOrders(1, 1000, { createdAt: currentRange })
  const { data: prevOrders } = useOrders(1, 1000, { createdAt: prevRange })

  const { clients: currentClients } = useClients(1, 1000, { createdAt: currentRange })
  const { clients: prevClients } = useClients(1, 1000, { createdAt: prevRange })

  const { incomes: currentIncomes } = useIncomes(1, 1000, { createdAt: currentRange })
  const { incomes: prevIncomes } = useIncomes(1, 1000, { createdAt: prevRange })

  const { outcomes: currentOutcomes } = useOutcomes(1, 1000, { createdAt: currentRange })
  const { outcomes: prevOutcomes } = useOutcomes(1, 1000, { createdAt: prevRange })

  const currentRevenue = useMemo(() => {
    const incomeTotal = currentIncomes.reduce((sum, i) => sum + (i.count || 0), 0)
    const outcomeTotal = currentOutcomes.reduce((sum, i) => sum + (i.count || 0), 0)
    return incomeTotal - outcomeTotal
  }, [currentIncomes, currentOutcomes])
  const prevRevenue = useMemo(() => {
    const incomeTotal = prevIncomes.reduce((sum, i) => sum + (i.count || 0), 0)
    const outcomeTotal = prevOutcomes.reduce((sum, i) => sum + (i.count || 0), 0)
    return incomeTotal - outcomeTotal
  }, [prevIncomes, prevOutcomes])

  const { percent: revPercent, trend: revTrend } = compareValues(currentRevenue, prevRevenue)
  const { percent: custPercent, trend: custTrend } = compareValues(currentClients.length, prevClients.length)
  const { percent: actPercent, trend: actTrend } = compareValues(currentOrders.length, prevOrders.length)
  const { percent: growthPercent, trend: growthTrend } = compareValues(currentIncomes.length, prevIncomes.length)

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Общий доход</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {currentRevenue.toLocaleString()} ₽
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {revTrend === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
              {revTrend === "up" ? '+' : '-'}{revPercent}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Доход за месяц {revTrend === "up" ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Сравнение с предыдущим месяцем
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Новые клиенты</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {currentClients.length}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {custTrend === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
              {custTrend === "up" ? '+' : '-'}{custPercent}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Клиенты за месяц {custTrend === "up" ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">Рост клиентской базы</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Активные заявки</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {currentOrders.length}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {actTrend === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
              {actTrend === "up" ? '+' : '-'}{actPercent}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Активность за месяц {actTrend === "up" ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">Количество новых заказов</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Число оплат</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {currentIncomes.length}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {growthTrend === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
              {growthTrend === "up" ? '+' : '-'}{growthPercent}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Динамика за месяц {growthTrend === "up" ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">Оплаты за период</div>
        </CardFooter>
      </Card>
    </div>
  )
}