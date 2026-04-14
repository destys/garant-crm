"use client";

import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  minHeight?: string;
};

/** Полупрозрачный оверлей со спиннером поверх контента при загрузке/рефетче данных */
export function DataLoadingOverlay({
  show,
  children,
  className,
  minHeight = "min-h-[200px]",
}: Props) {
  return (
    <div className={cn("relative", minHeight, className)}>
      {show ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/70 backdrop-blur-[1px]"
          aria-busy
          aria-live="polite"
        >
          <Loader2Icon className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : null}
      {children}
    </div>
  );
}
