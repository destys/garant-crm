/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconCirclePlusFilled } from "@tabler/icons-react";

import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"
import { useOrderFilterStore } from "@/stores/order-filters-store"
import { SIDEBAR_MENU } from "@/constants";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

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
            <Button variant="default" size="sm" className="mb-8" asChild>
                <Link href={'/orders/new-order'}>
                    <IconCirclePlusFilled />
                    <span className="hidden sm:block">Создать заявку</span>
                </Link>
            </Button>

            {SIDEBAR_MENU.map((item, i) => {
                if (item.separator) {
                    return <div key={i} className="my-2 border-t border-border" />
                }
                const count = 5;
                return (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            className={cn("justify-start cursor-pointer", activeTitle === item.title && "bg-muted text-primary")}
                            onClick={() => handleClick(item.title, item.filters, item.to)}
                        >
                            <button className="w-full flex items-center gap-2 justify-between" onClick={() => isMobile ? toggleSidebar() : null}>
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