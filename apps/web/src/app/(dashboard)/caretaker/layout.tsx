"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { UserRole } from "@makazi/shared-types";
import { getMe, roleDashboardPath, type AuthUser } from "@/lib/auth";
import { Sidebar, CARETAKER_NAV_ITEMS } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface CaretakerUserContextValue {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
}

const CaretakerUserContext = React.createContext<CaretakerUserContextValue | null>(null);

export function useCaretakerUser(): AuthUser {
  const ctx = React.useContext(CaretakerUserContext);
  if (!ctx?.user) throw new Error("useCaretakerUser must be used within the caretaker layout");
  return ctx.user;
}

export function useSetCaretakerUser(): (user: AuthUser) => void {
  const ctx = React.useContext(CaretakerUserContext);
  if (!ctx) throw new Error("useSetCaretakerUser must be used within the caretaker layout");
  return ctx.setUser;
}

export default function CaretakerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/login");
      return;
    }
    getMe()
      .then((me) => {
        if (me.role !== UserRole.CARETAKER) {
          router.replace(roleDashboardPath[me.role]);
          return;
        }
        setUser(me);
      })
      .catch(() => {
        // apiFetch already redirects to /session-expired on a 401
      });
  }, [isLoaded, isSignedIn, router]);

  if (!user) return null;

  return (
    <CaretakerUserContext.Provider value={{ user, setUser }}>
      <div className="flex min-h-screen bg-[var(--paper)]">
        <div className="hidden md:flex">
          <Sidebar
            navItems={CARETAKER_NAV_ITEMS}
            settingsHref="/caretaker/settings"
            roleLabel="Caretaker"
            user={user}
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((c) => !c)}
          />
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-[230px] border-none">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar
              navItems={CARETAKER_NAV_ITEMS}
              settingsHref="/caretaker/settings"
              roleLabel="Caretaker"
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
            notificationsHref="/caretaker/notifications"
            settingsHref="/caretaker/settings"
            user={user}
          />
          <main className="flex-1 px-5 md:px-8 py-6 md:py-7 pb-14 max-w-[1360px] w-full mx-auto">{children}</main>
        </div>
      </div>
    </CaretakerUserContext.Provider>
  );
}
