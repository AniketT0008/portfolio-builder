import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireUser } from "@/lib/supabase/auth";

// Authenticated shell: always render per-request (never statically cached).
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireUser();

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <Logo href="/dashboard" />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserMenu
              name={profile?.full_name ?? null}
              email={user.email ?? null}
              avatarUrl={profile?.avatar_url ?? null}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border/60 p-4 lg:block">
          <SidebarNav />
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
