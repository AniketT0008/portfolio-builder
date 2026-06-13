import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/lib/types/database";

const MAP: Record<
  ProjectStatus,
  { label: string; variant: "secondary" | "success" | "warning" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  analyzing: { label: "Analyzing", variant: "warning" },
  ready: { label: "Ready", variant: "success" },
  error: { label: "Error", variant: "destructive" },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const { label, variant } = MAP[status];
  return (
    <Badge variant={variant} className="gap-1">
      {status === "analyzing" && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {label}
    </Badge>
  );
}
