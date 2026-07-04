"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Heart,
  Users,
  Calendar,
  Plus,
  Search,
  Settings,
  Moon,
  Sun,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/providers/theme-provider";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  userName?: string;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function AppHeader({ onSearch, searchQuery = "" }: AppHeaderProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme, theme, textSize, setTextSize } = useTheme();

  const navItems = [
    { href: "/recipes", label: "Recipes", icon: BookOpen },
    { href: "/favorites", label: "Favorites", icon: Heart },
    { href: "/groups", label: "Groups", icon: Users },
    { href: "/meal-planner", label: "Planner", icon: Calendar },
  ];

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <header className="sticky top-0 z-40 border-b app-chrome-blur no-print">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-glow transition-transform group-hover:scale-105">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="hidden font-serif text-lg font-semibold text-fg sm:block">
              {APP_NAME}
            </span>
          </Link>

          {onSearch && (
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
              <Input
                placeholder="Search recipes, ingredients, tags..."
                className="pl-10 bg-elevated/80"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleTheme}
              aria-label="Toggle theme"
              className="text-fg-secondary hover:text-fg"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTextSize(textSize === "large" ? "normal" : "large")
              }
              aria-label="Toggle large text"
              className={cn(
                "text-fg-secondary hover:text-fg",
                textSize === "large" && "bg-accent-subtle text-accent",
              )}
            >
              <Type className="h-4 w-4" />
            </Button>
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Settings"
                className="text-fg-secondary hover:text-fg"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/recipes/new">
              <Button size="sm" className="hidden sm:flex shadow-glow">
                <Plus className="h-4 w-4" />
                Add Recipe
              </Button>
            </Link>
          </div>
        </div>

        <nav className="flex gap-1 pb-2 overflow-x-auto sm:hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
                size="sm"
                className="shrink-0"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}