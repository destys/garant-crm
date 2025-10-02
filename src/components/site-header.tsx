import { IconCirclePlusFilled } from "@tabler/icons-react";
import {
  CircleDollarSignIcon,
  DollarSignIcon,
  FilePieChart,
  MoveLeftIcon,
  PersonStandingIcon,
  SettingsIcon,
  Users2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/providers/auth-provider";
import { useCashbox } from "@/hooks/use-cashbox";
import { useModal } from "@/providers/modal-provider";

export function SiteHeader() {
  const { user, roleId } = useAuth();
  const { cashbox } = useCashbox();
  const router = useRouter();
  const { openModal } = useModal();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Button
          onClick={() => router.back()}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          title="Назад"
          size={"sm"}
        >
          <MoveLeftIcon className="w-5 h-5" />
        </Button>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {roleId !== 1 && (
          <>
            <Button variant={"link"} asChild>
              <Link href={"/accounting"}>
                <DollarSignIcon />
                <span className="max-lg:hidden">Бухгалтерия</span>
              </Link>
            </Button>
            <Button variant={"link"} asChild>
              <Link href={"/clients"}>
                <Users2Icon />
                <span className="max-lg:hidden">Клиенты</span>
              </Link>
            </Button>
            <Button variant={"link"} asChild>
              <Link href={"/cashbox"}>
                <CircleDollarSignIcon />
                <span className="max-lg:hidden">Касса</span>
              </Link>
            </Button>
            <Button variant={"link"} asChild>
              <Link href={"/masters"}>
                <PersonStandingIcon />
                <span className="max-lg:hidden">Сотрудники</span>
              </Link>
            </Button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {roleId !== 1 && (
            <div>
              <span className="max-md:text-[0px]">Касса: </span>
              <span className="text-xl font-bold text-green-500 whitespace-nowrap">
                {cashbox?.balance || 0} ₽
              </span>
            </div>
          )}
          {roleId !== 3 && (
            <div>
              Баланс:{" "}
              <span className="text-xl font-bold text-green-500">
                {user?.balance || 0} ₽
              </span>
            </div>
          )}
          {roleId !== 3 && (
            <Button
              title="Добавить оплату за смену"
              variant={"positive"}
              onClick={() => {
                openModal("shiftBalance", {
                  title: "Добавить зарплату за смену",
                });
              }}
            >
              <CircleDollarSignIcon />+ за смену
            </Button>
          )}

          <Button variant="default" size="sm" asChild>
            <Link href={"/orders/new-order"}>
              <IconCirclePlusFilled />
              <span className="hidden sm:block">Создать заявку</span>
            </Link>
          </Button>
          {roleId === 3 && (
            <>
              <Button asChild variant={"secondary"}>
                <Link href={"/reports"}>
                  <FilePieChart />
                </Link>
              </Button>
              <Button asChild variant={"secondary"}>
                <Link href={"/settings"}>
                  <SettingsIcon />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
