"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

interface TabsProps extends React.ComponentProps<typeof TabsPrimitive.Root> {
  id: string; // уникальный id для группы табов
  defaultValue?: string;
}

function Tabs({ id, className, defaultValue, ...props }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue);

  // читаем активный таб из URL при загрузке и при клике назад/вперёд
  React.useEffect(() => {
    const readFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const urlValue = params.get(`tab-${id}`);
      setValue(urlValue || defaultValue);
    };

    readFromUrl(); // при загрузке
    window.addEventListener("popstate", readFromUrl);
    return () => window.removeEventListener("popstate", readFromUrl);
  }, [id, defaultValue]);

  // при переключении таба меняем URL и добавляем запись в историю
  const handleChange = (val: string) => {
    setValue(val);
    const params = new URLSearchParams(window.location.search);
    params.set(`tab-${id}`, val);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ [`tab-${id}`]: val }, "", newUrl);
  };

  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={handleChange}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex size-fit items-center justify-center rounded-lg p-[3px] max-lg:flex-wrap",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-6 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
