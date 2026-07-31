"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";

export function ProfileForm({
  userId,
  email,
  initialName,
  avatarUrl,
}: {
  userId: string;
  email: string;
  initialName: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [fullName, setFullName] = React.useState(initialName);
  const [saving, setSaving] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error("Could not save profile.");
      return;
    }
    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={save}>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            This is how you appear inside ProjectForge.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={fullName} />
              ) : null}
              <AvatarFallback className="text-lg">
                {initials(fullName || email)}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">
              {avatarUrl
                ? "Synced from your sign-in provider."
                : "Add a name and we'll use your initials."}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
            <p className="text-xs text-muted-foreground">
              Your email is managed by your authentication provider.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" variant="gradient" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
