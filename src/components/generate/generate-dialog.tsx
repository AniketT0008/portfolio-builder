"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AUDIENCE_OPTIONS,
  DEFAULT_SETTINGS,
  LENGTH_OPTIONS,
  TONE_OPTIONS,
  type GenerationMeta,
  type GenerationSettings,
} from "@/lib/constants";
import type { Generation } from "@/lib/types/database";

export function GenerateDialog({
  projectId,
  meta,
  open,
  onOpenChange,
  onGenerated,
}: {
  projectId: string;
  meta: GenerationMeta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (generation: Generation) => void;
}) {
  const [settings, setSettings] =
    React.useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = React.useState(false);

  async function generate() {
    if (!meta) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: meta.type, settings }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Generation failed.");
      }
      onGenerated(json.generation as Generation);
      toast.success(`${meta.short} generated`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {meta && (
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br ${meta.accent} text-white`}
              >
                <Icon name={meta.icon} className="h-4 w-4" />
              </span>
            )}
            {meta?.label ?? "Generate"}
          </DialogTitle>
          <DialogDescription>{meta?.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tone</Label>
              <Select
                value={settings.tone}
                onValueChange={(v) =>
                  setSettings((s) => ({
                    ...s,
                    tone: v as GenerationSettings["tone"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Length</Label>
              <Select
                value={settings.length}
                onValueChange={(v) =>
                  setSettings((s) => ({
                    ...s,
                    length: v as GenerationSettings["length"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LENGTH_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select
              value={settings.audience}
              onValueChange={(v) =>
                setSettings((s) => ({
                  ...s,
                  audience: v as GenerationSettings["audience"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">
              Extra instructions{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="e.g. Target a backend internship; emphasize the distributed systems work."
              value={settings.notes ?? ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, notes: e.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button variant="gradient" onClick={generate} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
