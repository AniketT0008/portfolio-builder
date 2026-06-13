import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { APP_NAME } from "@/lib/constants";

const HIGHLIGHTS = [
  "Analyze a GitHub repo or files in one click",
  "Generate résumé bullets, READMEs, decks & more",
  "Tune tone, length and audience per output",
  "Version and favorite everything you create",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/90 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <Logo href="/" className="relative text-white [&_span]:text-white" />
        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Your work is impressive. <br /> Make it obvious.
          </h2>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-3 text-white/90">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/70">
          &copy; {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col p-6">
        <div className="flex items-center justify-between">
          <Logo href="/" className="lg:hidden" />
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm py-12">{children}</div>
        </div>
      </div>
    </div>
  );
}
