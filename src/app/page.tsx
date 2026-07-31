import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FolderUp,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

import { Icon } from "@/components/icon";
import { Logo } from "@/components/brand/logo";
import { SiteHeader } from "@/components/marketing/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  APP_NAME,
  CATEGORY_LABELS,
  GENERATION_CATALOG,
  type GenerationCategory,
} from "@/lib/constants";

const FEATURES = [
  {
    icon: FolderUp,
    title: "Bring any artifact",
    body: "GitHub repos, ZIPs, images, PDFs, videos, CAD files and docs. We pull the signal out of all of it.",
  },
  {
    icon: Wand2,
    title: "One analysis, ten outputs",
    body: "Analyze a project once, then generate résumé bullets, READMEs, decks and more — all grounded in the same facts.",
  },
  {
    icon: Sparkles,
    title: "Tuned for the moment",
    body: "Dial in tone, length and audience so the same project reads right for a recruiter, a professor, or a scholarship board.",
  },
  {
    icon: Zap,
    title: "Fast, structured, reusable",
    body: "Every generation is versioned, favoritable, and copy-paste ready. Iterate without losing earlier drafts.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Upload your project",
    body: "Link a GitHub repo or drop your files. Add a sentence of context if you like.",
  },
  {
    n: "02",
    title: "Let AI analyze it",
    body: "ProjectForge extracts the problem, stack, features, challenges and measurable impact.",
  },
  {
    n: "03",
    title: "Generate & ship",
    body: "Pick an output, tweak the settings, and copy polished, professional text in seconds.",
  },
];

const PERSONAS = [
  "High-school builders",
  "CS & engineering students",
  "Hackathon teams",
  "Robotics teams",
  "Side-project engineers",
  "Researchers",
];

export default function LandingPage() {
  const grouped = GENERATION_CATALOG.reduce(
    (acc, g) => {
      (acc[g.category] ??= []).push(g);
      return acc;
    },
    {} as Record<GenerationCategory, typeof GENERATION_CATALOG>,
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero ---------------------------------------------------------- */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <div className="absolute left-1/2 top-[-10%] -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />

          <div className="container flex flex-col items-center gap-8 py-24 text-center md:py-32">
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/30 bg-primary/5 py-1 text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              From raw project to polished proof
            </Badge>

            <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Turn the projects you built into the{" "}
              <span className="text-gradient">stories that get you hired</span>.
            </h1>

            <p className="max-w-2xl text-balance text-lg text-muted-foreground">
              {APP_NAME} ingests your repos, files and docs and writes the
              résumé bullets, interview stories, READMEs, portfolio pages and
              slide decks for you — quantified, audience-aware, and ready to
              ship.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button size="lg" variant="gradient" asChild>
                <Link href="/signup">
                  Start building free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/#outputs">See what it generates</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-sm text-muted-foreground">
              {PERSONAS.map((p) => (
                <span key={p} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features ------------------------------------------------------ */}
        <section id="features" className="border-t border-border/60 py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Built for the gap between{" "}
                <span className="text-gradient">making</span> and{" "}
                <span className="text-gradient">explaining</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                You did the hard part. ProjectForge handles the writing so your
                work actually lands.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <Card
                  key={f.title}
                  className="group relative overflow-hidden transition-shadow hover:shadow-lg"
                >
                  <CardContent className="pt-6">
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {f.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Outputs ------------------------------------------------------- */}
        <section id="outputs" className="border-t border-border/60 py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4">
                10 output types
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                One project. Every artifact you need.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Generate any of these from a single analyzed project — then
                regenerate with a different tone or audience anytime.
              </p>
            </div>

            <div className="mt-14 space-y-10">
              {(
                Object.keys(grouped) as GenerationCategory[]
              ).map((category) => (
                <div key={category}>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {grouped[category].map((g) => (
                      <Card
                        key={g.type}
                        className="group transition-all hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <CardContent className="flex gap-4 pt-6">
                          <div
                            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${g.accent} text-white shadow-sm`}
                          >
                            <Icon name={g.icon} className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold leading-tight">
                              {g.label}
                            </h4>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {g.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works -------------------------------------------------- */}
        <section id="how" className="border-t border-border/60 py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                From upload to polished in three steps
              </h2>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="relative">
                  <div className="text-5xl font-bold text-primary/15">
                    {s.n}
                  </div>
                  <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA ----------------------------------------------------------- */}
        <section className="border-t border-border/60 py-20">
          <div className="container">
            <Card className="relative overflow-hidden border-primary/20">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10" />
              <CardContent className="flex flex-col items-center gap-6 px-6 py-16 text-center">
                <h2 className="max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                  Your projects deserve better than a one-line résumé entry.
                </h2>
                <p className="max-w-xl text-muted-foreground">
                  Sign up free, link your first repo, and watch ProjectForge
                  turn it into a portfolio-ready story.
                </p>
                <Button size="lg" variant="gradient" asChild>
                  <Link href="/signup">
                    Create your account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer ---------------------------------------------------------- */}
      <footer className="border-t border-border/60 py-10">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_NAME}. Built for makers.
          </p>
        </div>
      </footer>
    </div>
  );
}
