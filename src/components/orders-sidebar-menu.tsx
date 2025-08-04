/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconCirclePlusFilled } from "@tabler/icons-react";

import { SidebarMenu } from "@/components/ui/sidebar"
import { useOrderFilterStore } from "@/stores/order-filters-store"
import { SIDEBAR_MENU } from "@/constants";
import { Button } from "@/components/ui/button";

import { SidebarMenuItemWithCount } from "./sidebar/sidebar-menu-item-with-count";

export function OrdersSidebarMenu() {
    const { activeTitle } = useOrderFilterStore();
    const router = useRouter();

    const handleClick = (title?: string, filters?: any, to?: string) => {
        if (!title || !to) return null;
        const { setFilters, setActiveTitle } = useOrderFilterStore.getState();
        setFilters(filters || {});
        setActiveTitle(title);
        router.push(to);
    };

    return (
        <SidebarMenu className="mt-10">
            <Button variant="default" size="sm" className="mb-8" asChild>
                <Link href={"/orders/new-order"}>
                    <IconCirclePlusFilled />
                    <span className="hidden sm:block">Создать заявку</span>
                </Link>
            </Button>

            {SIDEBAR_MENU.map((item, i) => {
                if (item.separator) {
                    return <div key={i} className="my-2 border-t border-border" />;
                }

                const handleMenuClick = () => {
                    handleClick(item.title, item.filters, item.to);
                };

                return (
                    <SidebarMenuItemWithCount
                        key={item.title}
                        item={item}
                        activeTitle={activeTitle}
                        onClick={handleMenuClick}
                    />
                );
            })}
        </SidebarMenu>
    );
}