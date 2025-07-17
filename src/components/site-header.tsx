import { IconCirclePlusFilled } from "@tabler/icons-react"
import { MoveLeftIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  const router = useRouter();

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
          size={'sm'}
        >
          <MoveLeftIcon className="w-5 h-5" />
        </Button>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="default" size="sm" asChild>
            <Link href={'/orders/new-order'}>
              <IconCirclePlusFilled />
              <span className="hidden sm:block">Создать заявку</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
