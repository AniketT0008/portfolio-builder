"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Github, Loader2, Mail, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import {
  isSupabaseConfigured,
  isAnonKeyMisconfigured,
  getSiteUrl,
} from "@/lib/supabase/config";

type Mode = "login" | "signup";

type HealthPayload = {
  status?: string;
  supabase?: boolean;
  supabaseReachable?: boolean;
  checks?: {
    supabaseUrlHost?: string | null;
    supabaseReachabilityError?: string | null;
    anonKeyMisconfigured?: boolean;
  };
};

function friendlyAuthError(err: unknown): string {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const lower = message.toLowerCase();

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("network request failed")
  ) {
    return "Cannot reach your Supabase project. It may be paused or deleted — check Vercel env vars and the Supabase dashboard.";
  }
  if (lower.includes("unsupported provider") || lower.includes("provider is not enabled")) {
    return "GitHub sign-in isn't enabled. In Supabase → Authentication → Providers, enable GitHub and add your OAuth app credentials.";
  }
  if (lower.includes("pkce") || lower.includes("code verifier")) {
    return "GitHub sign-in lost its login cookie mid-redirect. Try again, or use email sign-in. If it keeps failing, confirm the GitHub provider is enabled in Supabase.";
  }
  if (lower.includes("redirect") && lower.includes("not allowed")) {
    return "Redirect URL not allowed. Add https://portfolio-builder-fawn.vercel.app/** to Supabase → Authentication → URL Configuration.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email first (check inbox), or disable email confirmations in Supabase Auth settings for testing.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  return message || "Something went wrong.";
}

export function AuthForm({
  mode,
  initialConfigured = false,
}: {
  mode: Mode;
  initialConfigured?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [configured, setConfigured] = React.useState(initialConfigured);
  const [reachable, setReachable] = React.useState<boolean | null>(null);
  const [reachError, setReachError] = React.useState<string | null>(null);
  const [supabaseHost, setSupabaseHost] = React.useState<string | null>(null);
  const supabase = React.useMemo(
    () => (configured ? createClient() : null),
    [configured],
  );

  // Re-check runtime-injected public env after mount (Vercel may add vars after build).
  React.useEffect(() => {
    setConfigured(isSupabaseConfigured());
  }, [initialConfigured]);

  // Live connectivity probe — env can look fine while the project DNS is dead.
  React.useEffect(() => {
    let cancelled = false;
    async function probe() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = (await res.json()) as HealthPayload;
        if (cancelled) return;
        setReachable(Boolean(data.supabaseReachable));
        setReachError(data.checks?.supabaseReachabilityError ?? null);
        setSupabaseHost(data.checks?.supabaseUrlHost ?? null);
      } catch {
        if (!cancelled) {
          setReachable(false);
          setReachError("health_check_failed");
        }
      }
    }
    void probe();
    return () => {
      cancelled = true;
    };
  }, []);

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [oauthLoading, setOauthLoading] = React.useState(false);

  const redirectedFrom = searchParams.get("redirectedFrom") || "/dashboard";

  // Surface auth errors forwarded via query string (callback / OAuth provider).
  React.useEffect(() => {
    const err =
      searchParams.get("error_description") ||
      searchParams.get("error") ||
      searchParams.get("message");
    if (err) toast.error(friendlyAuthError(decodeURIComponent(err)));
  }, [searchParams]);

  const siteUrl =
    getSiteUrl() ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const authBlocked =
    !configured || reachable === false || isAnonKeyMisconfigured();
  const disabled = authBlocked || loading || oauthLoading;

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      toast.error("Supabase isn't configured yet.");
      return;
    }
    if (reachable === false) {
      toast.error(friendlyAuthError(new Error("Failed to fetch")));
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(
              redirectedFrom,
            )}`,
          },
        });
        if (error) throw error;
        toast.success("Account created", {
          description:
            "Check your inbox to confirm your email, then sign in. If confirmations are off, you're in!",
        });
        router.push("/login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        router.push(redirectedFrom);
        router.refresh();
      }
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleGitHub() {
    if (!configured) {
      toast.error("Supabase isn't configured yet.");
      return;
    }
    if (reachable === false) {
      toast.error(friendlyAuthError(new Error("Failed to fetch")));
      return;
    }
    setOauthLoading(true);
    // Server route sets the PKCE verifier cookie on the redirect response.
    const params = new URLSearchParams({
      next: redirectedFrom,
      scopes: "read:user user:email",
    });
    window.location.assign(`/auth/github?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "login"
            ? "Sign in to keep building your story."
            : "Start turning projects into polished proof — free."}
        </p>
      </div>

      {!configured && isAnonKeyMisconfigured() && (
        <div className="flex gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="space-y-1">
            <p className="font-medium text-red-600 dark:text-red-400">
              Wrong Supabase anon key
            </p>
            <p className="text-muted-foreground">
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> is
              set to your project URL — it must be the{" "}
              <strong>anon public</strong> JWT key from Supabase → Settings →
              API Keys → Legacy tab (starts with{" "}
              <code className="text-xs">eyJ...</code>). Fix in Vercel and
              redeploy.
            </p>
          </div>
        </div>
      )}

      {!configured && !isAnonKeyMisconfigured() && (
        <div className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="font-medium text-amber-600 dark:text-amber-400">
              Supabase isn&apos;t connected yet
            </p>
            <p className="text-muted-foreground">
              Add{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in
              Vercel → Settings → Environment Variables, then redeploy. See the
              README for setup.
            </p>
          </div>
        </div>
      )}

      {configured && reachable === false && (
        <div className="flex gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="space-y-1">
            <p className="font-medium text-red-600 dark:text-red-400">
              Database unreachable
            </p>
            <p className="text-muted-foreground">
              Env vars are set
              {supabaseHost ? (
                <>
                  {" "}
                  (<code className="text-xs">{supabaseHost}</code>)
                </>
              ) : null}
              , but the Supabase project does not respond
              {reachError ? (
                <>
                  {" "}
                  (<code className="text-xs">{reachError}</code>)
                </>
              ) : null}
              . It was likely paused or deleted. Create a new Supabase project,
              run the SQL migrations, update Vercel env vars, and redeploy.
            </p>
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGitHub}
        disabled={disabled}
      >
        {oauthLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Github className="h-4 w-4" />
        )}
        Continue with GitHub
      </Button>

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs uppercase tracking-wider text-muted-foreground">
          or
        </span>
      </div>

      <form onSubmit={handleEmail} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              placeholder="Ada Lovelace"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              disabled={disabled}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            disabled={disabled}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          variant="gradient"
          disabled={disabled}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
