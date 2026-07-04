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
    <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-surface p-4 no-print">
      <nav className="flex flex-col gap-1">
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
                  "w-full justify-start gap-3",
                  isActive &&
                    "bg-accent-subtle text-accent border-l-2 border-accent rounded-l-none pl-[calc(1.25rem-2px)]",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
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
