"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Heart, Plus, Users, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/recipes/new", label: "Add", icon: Plus, highlight: true },
  { href: "/favorites", label: "Saved", icon: Heart },
  { href: "/groups", label: "Groups", icon: Users },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-cream-300 bg-cream-100/95 backdrop-blur-md lg:hidden no-print">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href) && item.href !== "/recipes/new"
                ? true
                : item.href === "/recipes/new"
                  ? pathname === "/recipes/new"
                  : false;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[60px]",
                item.highlight
                  ? "bg-sage-600 text-white -mt-4 shadow-lg rounded-2xl px-4 py-3"
                  : isActive
                    ? "text-sage-600"
                    : "text-brown-400"
              )}
            >
              <item.icon className={cn("h-5 w-5", item.highlight && "h-6 w-6")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}