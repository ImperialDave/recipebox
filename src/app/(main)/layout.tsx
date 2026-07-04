import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";

export const dynamic = "force-dynamic";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-page">
      <SidebarNav />
      <div className="flex-1 flex flex-col pb-20 lg:pb-0 min-w-0 bg-page">
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
