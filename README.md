# ProjectPortfolio

**Turn raw project artifacts into polished, professional outputs with AI.**

ProjectForge AI lets students, engineers, hackathon teams, robotics teams and
makers upload their raw project artifacts — GitHub repos, ZIPs, images, PDFs,
videos, CAD files and docs — and uses AI to automatically generate
career-ready, portfolio-ready content.

## What it generates

From a single analyzed project you can produce:

| Output | Description |
| --- | --- |
| **Resume bullet points** | Achievement-focused, quantified, ATS-friendly |
| **STAR interview responses** | Situation → Task → Action → Result stories |
| **Portfolio project page** | Summary, deep-dive, features, lessons learned |
| **GitHub README** | Install, usage, architecture, tech stack |
| **LinkedIn posts** | Announcement / achievement / technical breakdown |
| **Presentation slide decks** | 5-min & 10-min versions with speaker notes |
| **Technical documentation** | Architecture, components, build instructions |
| **Architecture overview** | High-level design with a Mermaid diagram |
| **Cover letter paragraphs** | Tailored to a target role |
| **Scholarship / competition responses** | Impact framed for non-technical reviewers |

Each generation is tunable by **tone**, **length** and **audience**, is
**versioned**, and can be **favorited** into your Library.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + GitHub OAuth) |
| File storage | Supabase Storage |
| AI | Google Gemini (`gemini-2.5-flash`) via the OpenAI-compatible API |
| Deployment | Vercel-ready |

## Getting started

### 1. Prerequisites

- Node.js 18.18+ (tested on Node 24)
- A [Supabase](https://supabase.com) project
- A free [Google Gemini API key](https://aistudio.google.com/apikey)

### 2. Install

```bash
npm install
```

### 3. Configure environment

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
GEMINI_MODEL=<your-gemini-api-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# optional: raises GitHub API rate limits when ingesting public repos
GITHUB_TOKEN=
```

### 4. Set up the database

Run **all** SQL migrations against your Supabase project (in order), either by
pasting each file into the Supabase **SQL Editor**, or via the CLI:

```bash
# supabase/migrations/0001_init.sql
# supabase/migrations/0002_security_fixes.sql
# supabase/migrations/0003_import_and_code_studio.sql
# supabase/migrations/0004_premium_generations.sql
supabase db push        # if you've linked the project
```

This creates `profiles`, `projects`, `artifacts`, `generations`, and related
tables, enables **Row Level Security**, adds the auto-profile trigger on
sign-up, and provisions the private **`artifacts`** Storage bucket.

### 5. Configure Auth (required for login)

#### A. Supabase → Authentication → URL Configuration

| Setting | Value |
| --- | --- |
| **Site URL** | `https://portfolio-builder-fawn.vercel.app` (prod) or `http://localhost:3000` (local) |
| **Redirect URLs** | `https://portfolio-builder-fawn.vercel.app/**` |
| | `https://portfolio-builder-fawn.vercel.app/auth/callback` |
| | `http://localhost:3000/**` |
| | `http://localhost:3000/auth/callback` |

#### B. Email provider

**Authentication → Providers → Email** — enable it. For fastest testing you can
disable **Confirm email**; the app handles both confirmed and unconfirmed flows.

#### C. GitHub OAuth (Continue with GitHub)

1. Create a GitHub OAuth App: https://github.com/settings/developers →
   **OAuth Apps** → **New OAuth App**
   - **Homepage URL:** `https://portfolio-builder-fawn.vercel.app`
   - **Authorization callback URL (must be the Supabase callback, not the app):**
     `https://<your-project-ref>.supabase.co/auth/v1/callback`
2. Copy the Client ID + generate a Client Secret.
3. In Supabase → **Authentication → Providers → GitHub** — enable, paste
   Client ID / Secret, save.

#### D. Vercel environment variables

In **Vercel → portfolio-builder → Settings → Environment Variables**, set for
**Production** and **Preview**:

| Name | Example |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon/public) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (server only) |
| `GEMINI_MODEL` | your Gemini API key |
| `NEXT_PUBLIC_SITE_URL` | `https://portfolio-builder-fawn.vercel.app` |

After changing env vars, **redeploy**. Verify
[`/api/health`](https://portfolio-builder-fawn.vercel.app/api/health) shows
`supabaseReachable: true` (not just `supabase: true`).

> **If login still fails:** a paused/deleted Supabase project leaves env vars
> looking valid while DNS returns NXDOMAIN. Create a **new** Supabase project,
> re-run migrations, update the three Supabase env vars, and redeploy.

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful scripts

```bash
npm run dev        # start the dev server
npm run build      # production build
npm run start      # run the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit (strict)
```

## How it works

1. **Create a project** and attach artifacts (link a GitHub repo or upload
   files to Supabase Storage).
2. **Analyze** — the server ingests each artifact (live GitHub metadata +
   README + file tree, ZIP contents, text extraction) and asks the model to
   produce a normalized analysis stored in `projects.extracted_data`.
3. **Generate** — pick any output type, tune the settings, and the model writes
   it grounded in the analysis. Results are saved to `generations`.

## Project structure

```
src/
├── app/
│   ├── (auth)/                 # login & signup (route group)
│   ├── (dashboard)/            # authenticated app shell + pages
│   │   ├── dashboard/
│   │   ├── projects/[id]/      # project workspace
│   │   ├── library/            # favorited outputs
│   │   └── settings/
│   ├── api/
│   │   └── projects/[id]/
│   │       ├── analyze/        # POST – run AI analysis
│   │       └── generate/       # POST – run a generation
│   ├── auth/                   # OAuth callback + signout
│   ├── layout.tsx
│   └── page.tsx                # marketing landing page
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── generate/               # generation dialog, viewer, items
│   └── projects/               # workspace, uploader, analysis views
├── lib/
│   ├── ai/                     # Gemini client, prompts, ingestion, engine, schemas
│   ├── supabase/               # browser/server/middleware clients + auth
│   ├── constants.ts            # generation catalog & settings
│   └── validation.ts           # zod request schemas
└── middleware.ts               # session refresh + route protection
supabase/migrations/0001_init.sql
```

## Deployment (Vercel)

1. Push this repo to GitHub and import it into Vercel (project name can differ
   from the `*.vercel.app` subdomain).
2. Add the environment variables above in **Project Settings → Environment
   Variables** for Production + Preview. Set `NEXT_PUBLIC_SITE_URL` to your
   production domain (no trailing slash).
3. Add your production URL to the Supabase Auth redirect allow-list (see §5).
4. Deploy. Confirm `/api/health` reports `status: "ok"` and
   `supabaseReachable: true`.
5. The AI routes are configured with `maxDuration = 60`.

## Troubleshooting login

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Login form says **Database unreachable** | Supabase project paused/deleted | New project + update Vercel env + migrations |
| **Supabase isn't connected** banner | Missing `NEXT_PUBLIC_SUPABASE_*` on Vercel | Add env vars and redeploy |
| GitHub button errors / unsupported provider | GitHub provider off or bad OAuth app | Enable provider; callback must be `https://<ref>.supabase.co/auth/v1/callback` |
| Redirect / PKCE errors after GitHub | Redirect URL not allow-listed | Add `https://your-domain/**` and `/auth/callback` in Supabase URL config |
| Email signup works but dashboard empty / RLS errors | Migrations not applied | Run `0001`–`0004` in SQL Editor |

## Security notes

- Every table has **RLS enabled**; users can only read/write rows where
  `user_id = auth.uid()`.
- Storage objects live under `{user_id}/{project_id}/...` and are protected by
  storage policies keyed on the first path segment.
- The `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_MODEL` are **server-only** and
  never shipped to the browser.

## License

MIT
