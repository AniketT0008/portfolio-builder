"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Download,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Settings,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/import", label: "Import Hub", icon: Download },
  { href: "/code-studio", label: "Code Studio", icon: Wand2 },
  { href: "/resume-builder", label: "Resume Builder", icon: FileText },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/library", label: "Library", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-2">
      <Button asChild variant="gradient" className="w-full justify-start">
        <Link href="/projects/new">
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </Button>

      <nav className="mt-4 flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border bg-gradient-to-br from-primary/5 to-violet-500/5 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Pro tip
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Use Import Hub to pull GitHub repos, or Code Studio to upload code and
          push a polished repo automatically.
        </p>
      </div>
    </div>
  );
}
