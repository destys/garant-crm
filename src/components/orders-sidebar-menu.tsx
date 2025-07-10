import { useRouter } from "next/navigation";

import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { useOrderFilterStore } from "@/stores/order-filters-store"
import { SIDEBAR_MENU } from "@/constants";
import { cn } from "@/lib/utils";

export function OrdersSidebarMenu() {
    const { activeTitle } = useOrderFilterStore();
    const router = useRouter();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                return (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            className={cn("justify-start cursor-pointer", activeTitle === item.title && "bg-muted text-primary")}
                            onClick={() => handleClick(item.title, item.filters, item.to)}
                        >
                            <button className="w-full flex items-center gap-2">
                                {item.icon && <item.icon className="w-4 h-4" />}
                                <span>{item.title}</span>
                            </button>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            })}
        </SidebarMenu>
    )
}