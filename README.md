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

Run the SQL migration against your Supabase project. Either paste
`supabase/migrations/0001_init.sql` into the Supabase **SQL Editor** and run it,
or use the Supabase CLI:

```bash
supabase db push        # if you've linked the project
# or
psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
```

This creates the `profiles`, `projects`, `artifacts` and `generations` tables,
enables **Row Level Security** with per-user policies, adds triggers
(`updated_at`, auto profile creation on sign-up), and provisions a private
**`artifacts`** Storage bucket with owner-scoped access policies.

### 5. Configure Auth

In the Supabase dashboard:

1. **Authentication → Providers → Email** — enable it. (Disable "Confirm email"
   for the fastest local testing, or keep it on; the app handles both.)
2. **Authentication → Providers → GitHub** — enable and add your GitHub OAuth
   app's Client ID/Secret. Set the GitHub OAuth callback to
   `https://<your-ref>.supabase.co/auth/v1/callback`.
3. **Authentication → URL Configuration** — add `http://localhost:3000/**` (and
   your production URL) to the redirect allow-list.

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

1. Push this repo to GitHub and import it into Vercel.
2. Add the same environment variables in **Project Settings → Environment
   Variables**. Set `NEXT_PUBLIC_SITE_URL` to your production domain.
3. Add your production URL to the Supabase Auth redirect allow-list.
4. Deploy. The AI routes are configured with `maxDuration = 60`.

## Security notes

- Every table has **RLS enabled**; users can only read/write rows where
  `user_id = auth.uid()`.
- Storage objects live under `{user_id}/{project_id}/...` and are protected by
  storage policies keyed on the first path segment.
- The `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_MODEL` are **server-only** and
  never shipped to the browser.

## License

MIT
