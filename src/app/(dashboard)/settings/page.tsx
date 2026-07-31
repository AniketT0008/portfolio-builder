import type { Metadata } from "next";
import { LogOut } from "lucide-react";

import { IntegrationsForm } from "@/components/settings/integrations-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, profile } = await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and account.
        </p>
      </div>

      <ProfileForm
        userId={user.id}
        email={user.email ?? ""}
        initialName={profile?.full_name ?? ""}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <IntegrationsForm
        userId={user.id}
        initialGithubUsername={profile?.github_username}
        initialLinkedinUrl={profile?.linkedin_url}
      />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Sign out of this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
