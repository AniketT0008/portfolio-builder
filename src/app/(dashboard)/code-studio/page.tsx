import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CodeStudioWorkspace } from "@/components/code-studio/code-studio-workspace";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/supabase/auth";
import type { CodeStudioSession } from "@/lib/types/database";

export const metadata: Metadata = { title: "Code Studio" };

export default async function CodeStudioPage() {
  const { user, supabase } = await requireUser();

  const { data: sessions } = await supabase
    .from("code_studio_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Code Studio</h1>
          <p className="text-muted-foreground">
            Upload messy code — AI restructures it, writes a README, drafts a
            LinkedIn post, and pushes to GitHub for you.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link href="/import">
            Import Hub
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <CodeStudioWorkspace
        initialSessions={(sessions ?? []) as CodeStudioSession[]}
      />
    </div>
  );
}
