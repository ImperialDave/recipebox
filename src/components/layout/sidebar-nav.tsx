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
    <aside className="hidden lg:flex w-64 flex-col border-r border-cream-300 bg-cream-50 p-4 no-print">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-sage-100 text-sage-800"
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
          <Button className="w-full gap-2" size="lg">
            <Plus className="h-5 w-5" />
            Add New Recipe
          </Button>
        </Link>
      </div>
    </aside>
  );
}