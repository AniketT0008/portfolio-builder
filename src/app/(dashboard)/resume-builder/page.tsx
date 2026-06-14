import type { Metadata } from "next";

import { ResumeBuilder } from "@/components/resume/resume-builder";
import { getProjectsWithCounts } from "@/lib/data";
import { requireUser } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "Resume Builder" };

export default async function ResumeBuilderPage() {
  const { supabase } = await requireUser();
  const projects = await getProjectsWithCounts(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resume Builder</h1>
        <p className="text-muted-foreground">
          Combine multiple projects into résumé sections, or analyze gaps
          against a job posting.
        </p>
      </div>
      <ResumeBuilder projects={projects} />
    </div>
  );
}
