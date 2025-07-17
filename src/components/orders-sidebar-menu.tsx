/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/navigation";

import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"
import { useOrderFilterStore } from "@/stores/order-filters-store"
import { SIDEBAR_MENU } from "@/constants";
import { cn } from "@/lib/utils";
import { demoOrders } from "@/demo-data";
import { useIsMobile } from "@/hooks/use-mobile";

// Простая функция фильтрации по фильтрам из SIDEBAR_MENU (только order_status $eq/$ne/$in)
function countOrdersByFilter(filters: Record<string, any>): number {
    if (!filters) return demoOrders.length;
    // $and
    if (filters.$and) {
        return demoOrders.filter(order =>
            (filters.$and as Record<string, any>[]).every((cond) => {
                if (cond.order_status?.$ne) {
                    return order.order_status !== cond.order_status.$ne;
                }
                if (cond.order_status?.$eq) {
                    return order.order_status === cond.order_status.$eq;
                }
                return true;
            })
        ).length;
    }
    // $or
    if (filters.$or) {
        return demoOrders.filter(order =>
            (filters.$or as Record<string, any>[]).some((cond) => {
                if (cond.order_status?.$eq) {
                    return order.order_status === cond.order_status.$eq;
                }
                return true;
            })
        ).length;
    }
    // $in
    if (filters.order_status?.$in) {
        return demoOrders.filter(order =>
            filters.order_status.$in.includes(order.order_status)
        ).length;
    }
    // order_status $eq
    if (filters.order_status?.$eq) {
        return demoOrders.filter(order => order.order_status === filters.order_status.$eq).length;
    }
    // order_status $ne
    if (filters.order_status?.$ne) {
        return demoOrders.filter(order => order.order_status !== filters.order_status.$ne).length;
    }
    return demoOrders.length;
}

export function OrdersSidebarMenu() {
    const { activeTitle } = useOrderFilterStore();
    const router = useRouter();
    const isMobile = useIsMobile();
    const { toggleSidebar } = useSidebar();


    const handleClick = (title?: string, filters?: any, to?: string) => {

        if (!title || !to) return null;
        const { setFilters, setActiveTitle } = useOrderFilterStore.getState()

        setFilters(filters || null)
        setActiveTitle(title)
        router.push(to)
    }

    return (
        <SidebarMenu className="mt-10">
            {SIDEBAR_MENU.map((item, i) => {
                if (item.separator) {
                    return <div key={i} className="my-2 border-t border-border" />
                }
                const count = item.to === "/orders" && item.filters ? countOrdersByFilter(item.filters) : undefined;
                return (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            className={cn("justify-start cursor-pointer", activeTitle === item.title && "bg-muted text-primary")}
                            onClick={() => handleClick(item.title, item.filters, item.to)}
                        >
                            <button className="w-full flex items-center gap-2 justify-between" onClick={() => isMobile ? toggleSidebar : null}>
                                <span className="flex items-center gap-2">
                                    {item.icon && <item.icon className="w-4 h-4" />}
                                    <span>{item.title}</span>
                                </span>
                                {typeof count === "number" && (
                                    <span className="ml-2 text-xs bg-muted rounded px-2 py-0.5">
                                        {count}
                                    </span>
                                )}
                            </button>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            })}
        </SidebarMenu>
    )
}