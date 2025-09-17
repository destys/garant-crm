/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconCirclePlusFilled } from "@tabler/icons-react";

import { SidebarMenu } from "@/components/ui/sidebar";
import { useOrderFilterStore } from "@/stores/order-filters-store";
import { SIDEBAR_MENU } from "@/constants";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

import { SidebarMenuItemWithCount } from "./sidebar/sidebar-menu-item-with-count";

function withMasterInAnd(base: any, roleId: number | null, userId?: number) {
  // глубоко не мутируем исходные filters
  const result = base ? JSON.parse(JSON.stringify(base)) : {};

  // гарантируем $and-массив
  let andArr = Array.isArray(result.$and) ? result.$and : [];

  // убираем возможные корневые/дублирующие master-условия
  delete result.master;
  andArr = andArr.filter(
    (c: any) => !(c && typeof c === "object" && "master" in c)
  );

  // если мастер — добавляем своё условие
  if (roleId === 1 && userId) {
    andArr.push({ master: { id: { $eq: userId } } });
  }

  if (andArr.length) result.$and = andArr;
  return result;
}

export function OrdersSidebarMenu() {
  const { activeTitle } = useOrderFilterStore();
  const router = useRouter();
  const { roleId, user } = useAuth();

  const handleClick = (title?: string, filters?: any, to?: string) => {
    if (!title || !to) return null;
    const { setFilters, setActiveTitle } = useOrderFilterStore.getState();
    setFilters(filters || {});
    setActiveTitle(title);
    router.push(to);
  };

  if (!user || !roleId) return null;

  return (
    <SidebarMenu className="mt-5">
      <Button variant="default" size="sm" className="mb-3" asChild>
        <Link href={"/orders/new-order"}>
          <IconCirclePlusFilled />
          <span className="hidden sm:block">Создать заявку</span>
        </Link>
      </Button>

      {SIDEBAR_MENU.map((item, i) => {
        if (item.separator) {
          return <div key={i} className="my-2 border-t border-border" />;
        }

        if (roleId === 4 && item.adminOnly) return null;
        if (roleId === 1 && (item.adminOnly || item.managerOnly)) return null;
        if (roleId === 3 && item.hideForAdmin) return null;

        // прокидываем мастер-фильтр внутрь $and
        const filtersWithMaster = withMasterInAnd(
          item.filters,
          roleId,
          user?.id
        );
        const itemWithFilters = { ...item, filters: filtersWithMaster };

        const handleMenuClick = () => {
          handleClick(
            itemWithFilters.title,
            itemWithFilters.filters,
            itemWithFilters.to
          );
        };

        return (
          <SidebarMenuItemWithCount
            key={item.title}
            item={itemWithFilters}
            activeTitle={activeTitle}
            onClick={handleMenuClick}
          />
        );
      })}
    </SidebarMenu>
  );
}
