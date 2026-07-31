import {
  Award,
  ListChecks,
  Target,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ExtractedData } from "@/lib/ai/types";

function Chips({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Badge key={i} variant="secondary" className="font-normal">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function BulletBlock({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Award;
  title: string;
  items: string[];
}) {
  if (!items.length) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <ul className="ml-1 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExtractedDataView({ data }: { data: ExtractedData }) {
  return (
    <div className="space-y-6">
      {data.summary && (
        <p className="text-sm leading-relaxed">{data.summary}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {data.domain && <Badge variant="info">{data.domain}</Badge>}
        {data.role && <Badge variant="outline">Role: {data.role}</Badge>}
        {data.timeline && (
          <Badge variant="outline">{data.timeline}</Badge>
        )}
      </div>

      {data.techStack.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-semibold">Tech stack</div>
          <Chips items={data.techStack} />
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <BulletBlock icon={Award} title="Highlights" items={data.highlights} />
        <BulletBlock
          icon={TrendingUp}
          title="Outcomes & impact"
          items={[...data.metrics, ...data.outcomes]}
        />
        <BulletBlock
          icon={ListChecks}
          title="Key features"
          items={data.features}
        />
        <BulletBlock
          icon={TriangleAlert}
          title="Challenges solved"
          items={data.challenges}
        />
      </div>

      {data.targetRoles.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-primary" />
            Strong evidence for
          </div>
          <Chips items={data.targetRoles} />
        </div>
      )}
    </div>
  );
}
