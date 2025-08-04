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

export function SidebarMenuItemWithCount({
    item,
    activeTitle,
    onClick,
}: SidebarMenuItemWithCountProps) {
    const isMobile = useIsMobile();
    const { toggleSidebar } = useSidebar();
    const { total: count, isLoading } = useOrders(1, 1, item.filters);

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                className={cn(
                    "justify-start cursor-pointer",
                    activeTitle === item.title && "bg-muted text-primary"
                )}
                onClick={onClick}
            >
                <button
                    className="w-full flex items-center gap-2 justify-between"
                    onClick={() => (isMobile ? toggleSidebar() : null)}
                >
                    <span className="flex items-center gap-2">
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.title}</span>
                    </span>
                    {!isLoading && typeof count === "number" && item.filters && (
                        <span className="ml-2 text-xs bg-muted rounded px-2 py-0.5">
                            {count}
                        </span>
                    )}
                </button>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}