"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserRole } from "@makazi/shared-types";
import { getToken } from "@/lib/api";
import { getMe, roleDashboardPath, type AuthUser } from "@/lib/auth";
import { ADMIN_NAV_ITEMS, Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const AdminUserContext = React.createContext<AuthUser | null>(null);

export function useAdminUser(): AuthUser {
  const user = React.useContext(AdminUserContext);
  if (!user) throw new Error("useAdminUser must be used within the admin layout");
  return user;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isLoginPage = pathname === "/admin/login";

  React.useEffect(() => {
    if (isLoginPage) return;
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    getMe()
      .then((me) => {
        if (me.role !== UserRole.ADMIN) {
          router.replace(roleDashboardPath[me.role]);
          return;
        }
        setUser(me);
      })
      .catch(() => {
        // apiFetch already redirects to /session-expired on a 401
      });
  }, [router, isLoginPage]);

  if (isLoginPage) return <>{children}</>;
  if (!user) return null;

  return (
    <AdminUserContext.Provider value={user}>
      <div className="flex min-h-screen bg-[var(--paper)]">
        <div className="hidden md:flex">
          <Sidebar
            navItems={ADMIN_NAV_ITEMS}
            settingsHref="/admin/settings"
            roleLabel={user.adminSubRole ? formatSubRole(user.adminSubRole) : "Admin"}
            user={user}
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((c) => !c)}
          />
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-[230px] border-none">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar
              navItems={ADMIN_NAV_ITEMS}
              settingsHref="/admin/settings"
              roleLabel={user.adminSubRole ? formatSubRole(user.adminSubRole) : "Admin"}
              user={user}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar
            onToggleSidebarCollapsed={() => setCollapsed((c) => !c)}
            onOpenMobileMenu={() => setMobileOpen(true)}
            notificationsHref="/admin"
            settingsHref="/admin/settings"
            user={user}
          />
          <main className="flex-1 px-5 md:px-8 py-6 md:py-7 pb-14 max-w-[1360px] w-full mx-auto">{children}</main>
        </div>
      </div>
    </AdminUserContext.Provider>
  );
}

function formatSubRole(subRole: string): string {
  return subRole
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}
