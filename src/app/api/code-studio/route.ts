import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isServerSupabaseConfigured } from "@/lib/supabase/env.server";
import { codeStudioUploadSchema } from "@/lib/validation";
import type { CodeStudioSession, Json } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const { data, error } = await supabase
    .from("code_studio_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}

export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = codeStudioUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, files } = parsed.data;

  const { data: session, error } = await supabase
    .from("code_studio_sessions")
    .insert({
      user_id: user.id,
      name,
      source_files: files as unknown as Json,
      status: "uploaded",
    })
    .select("*")
    .single<CodeStudioSession>();

  if (error || !session) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create session." },
      { status: 500 },
    );
  }

  return NextResponse.json({ session });
}
