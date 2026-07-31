import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isServerSupabaseConfigured } from "@/lib/supabase/env.server";
import type { Profile } from "@/lib/types/database";

/** Returns the current user or null. Does not redirect. */
export async function getUser() {
  if (!isServerSupabaseConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Returns the current user + profile, or redirects to /login. */
export async function requireUser() {
  if (!isServerSupabaseConfigured()) redirect("/login");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile: profile as Profile | null, supabase };
}
