import { NextResponse } from "next/server";

import {
  getAuthenticatedUser,
  listAuthenticatedUserRepos,
  listUserRepos,
} from "@/lib/github/client";
import { createClient } from "@/lib/supabase/server";
import { getGitHubAccessToken, githubUsernameFromUser } from "@/lib/supabase/github-token";
import { isServerSupabaseConfigured } from "@/lib/supabase/env.server";
import type { Profile } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const token = await getGitHubAccessToken(supabase);

  const { data: profile } = await supabase
    .from("profiles")
    .select("github_username")
    .eq("id", user.id)
    .single<Pick<Profile, "github_username">>();

  const username =
    searchParams.get("username")?.trim() ||
    profile?.github_username?.trim() ||
    githubUsernameFromUser(user);

  try {
    let repos;
    let resolvedUsername = username;

    if (token) {
      repos = await listAuthenticatedUserRepos(token);
      const ghUser = await getAuthenticatedUser(token);
      if (ghUser) resolvedUsername = ghUser.login;
    } else if (username) {
      repos = await listUserRepos(username);
      resolvedUsername = username;
    } else {
      return NextResponse.json(
        {
          error:
            "Add your GitHub username in Settings, sign in with GitHub, or connect GitHub for private repos.",
          repos: [],
          username: null,
        },
        { status: 400 },
      );
    }

    const includeForks = searchParams.get("forks") === "true";
    const filtered = repos
      .filter((r) => includeForks || !r.fork)
      .map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        html_url: r.html_url,
        description: r.description,
        language: r.language,
        stargazers_count: r.stargazers_count,
        fork: r.fork,
        private: r.private,
        pushed_at: r.pushed_at,
      }));

    return NextResponse.json({
      username: resolvedUsername,
      hasToken: Boolean(token),
      repos: filtered,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch repos." },
      { status: 500 },
    );
  }
}
