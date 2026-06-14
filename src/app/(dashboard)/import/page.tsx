import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ImportHub } from "@/components/import/import-hub";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "Import Hub" };

export default async function ImportPage() {
  const { profile } = await requireUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Hub</h1>
          <p className="text-muted-foreground">
            Auto-import projects from GitHub and LinkedIn for your résumé — plus
            custom add-ons for anything else.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link href="/code-studio">
            Code Studio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <ImportHub
        initialGithubUsername={profile?.github_username}
        initialLinkedinUrl={profile?.linkedin_url}
      />
    </div>
  );
}
