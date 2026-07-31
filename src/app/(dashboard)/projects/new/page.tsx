import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CreateProjectForm } from "@/components/projects/create-project-form";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Create a new project
        </h1>
        <p className="text-muted-foreground">
          Start a workspace, then feed it your artifacts.
        </p>
      </div>
      <CreateProjectForm />
    </div>
  );
}
