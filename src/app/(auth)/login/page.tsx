import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";
import { isServerSupabaseConfigured } from "@/lib/supabase/env.server";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AuthForm
        mode="login"
        initialConfigured={isServerSupabaseConfigured()}
      />
    </Suspense>
  );
}
