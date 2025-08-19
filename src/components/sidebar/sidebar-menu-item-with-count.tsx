import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { SIDEBAR_MENU } from "@/constants";
import { useOrders } from "@/hooks/use-orders";

import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "../ui/sidebar";

interface SidebarMenuItemWithCountProps {
    item: (typeof SIDEBAR_MENU)[number];
    activeTitle: string | null;
    onClick: () => void;
}

function hasFilters(v: unknown): v is Record<string, unknown> {
    return v !== null && typeof v === "object" && Object.keys(v as Record<string, unknown>).length > 0;
}

export function SidebarMenuItemWithCount({
    item,
    activeTitle,
    onClick,
}: SidebarMenuItemWithCountProps) {
    const isMobile = useIsMobile();
    const { toggleSidebar } = useSidebar();

    // безопасно нормализуем filters
    const filters = useMemo<Record<string, unknown> | undefined>(() => {
        return hasFilters(item.filters) ? (item.filters as Record<string, unknown>) : undefined;
    }, [item.filters]);

    const isHiddenCount = !hasFilters(item.filters); // true, если фильтров нет

    // если фильтров нет — можно передать undefined, чтобы ключ запроса был стабильнее
    const { total: count, isLoading } = useOrders(1, 1, filters);

    const handleClick = () => {
        onClick();
        if (isMobile) toggleSidebar();
    };

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                className={cn(
                    "justify-start cursor-pointer",
                    activeTitle === item.title && "bg-muted text-primary"
                )}
                onClick={handleClick}
            >
                <button className="w-full flex items-center gap-2 justify-between">
                    <span className="flex items-center gap-2">
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.title}</span>
                    </span>

                    {!isLoading && typeof count === "number" && !isHiddenCount && (
                        <span className="ml-2 text-xs bg-muted rounded px-2 py-0.5">
                            {count}
                        </span>
                    )}
                </button>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}