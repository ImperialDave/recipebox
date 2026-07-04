"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Heart,
  Users,
  Calendar,
  Plus,
  Home,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_NAV_SUBTITLE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recipes", label: "All Recipes", icon: BookOpen },
  { href: "/favorites", label: "My Favorites", icon: Heart },
  { href: "/groups", label: "Family Groups", icon: Users },
  { href: "/meal-planner", label: "Meal Planner", icon: Calendar },
  { href: "/shopping-list", label: "Shopping List", icon: ShoppingCart },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r app-chrome no-print">
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-glow transition-transform group-hover:scale-105">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-serif text-base font-semibold text-fg truncate leading-tight">
              {APP_NAME}
            </p>
            <p className="text-xs text-fg-muted truncate">{APP_NAV_SUBTITLE}</p>
          </div>
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-11 rounded-lg text-fg-secondary hover:text-fg hover:bg-overlay",
                  isActive && "nav-item-active rounded-l-md font-medium",
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-accent")} />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link href="/recipes/new">
          <Button className="w-full gap-2 shadow-glow" size="lg">
            <Plus className="h-5 w-5" />
            Add New Recipe
          </Button>
        </Link>
      </div>
    </aside>
  );
}