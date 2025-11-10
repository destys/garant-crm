"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "./ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // пока не смонтировался клиент — не рендерим иконку, чтобы избежать HTML рассинхронизации
    return (
      <button
        className="p-2 rounded-md hover:bg-muted transition-colors"
        aria-label="Toggle theme"
      />
    );
  }

  return (
    <Button
      variant={"secondary"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md hover:bg-muted transition-colors"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
