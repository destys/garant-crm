"use client";

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Trend } from "@/lib/utils";

type Props = {
    label: string;
    value: string | number;
    percent: number;
    trend: Trend;
    note?: string;
};

export const StatCard = ({ label, value, percent, trend, note }: Props) => (
    <Card className="@container/card">
        <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {value}
            </CardTitle>
            <CardAction>
                <Badge variant="outline">
                    {trend === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
                    {trend === "up" ? "+" : "-"}
                    {percent}%
                </Badge>
            </CardAction>
        </CardHeader>
        {note && (
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                    {note} {trend === "up" ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
                </div>
                <div className="text-muted-foreground">Сравнение с предыдущим месяцем</div>
            </CardFooter>
        )}
    </Card>
);