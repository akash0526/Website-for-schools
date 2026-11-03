# SchoolSite — a school website you can sell

A working, single-school website template with a public website and a protected school-admin workspace.

**Stack:** React + TypeScript + Vite · Node.js + Express · Supabase PostgreSQL/Auth · ImageKit.

Each school gets its own deployment, Supabase project, and image-storage folder. This is **not a multi-tenant SaaS** and does not include billing or subscription management.

## Try it first

Requires **Node.js 20.19+** and npm.

```bash
npm install
npm run dev
```

- Public website: **http://localhost:5173**
- School workspace: **http://localhost:5173/admin**
- Click **Explore the admin demo**. No password or external account is needed.

The default `APP_MODE=demo` uses a local JSON store and local image uploads. Demo content is fictional. Changes survive API restarts in `server/data/demo.json`; uploaded demo images live in `server/data/uploads/`. Test runs use isolated in-memory data.

> **Important:** the included automated tests and preview exercise the demo adapters. The Supabase schema and ImageKit integration are included, but need your own credentials for a connected live acceptance test. Follow [the live setup guide](docs/SETUP.md) before delivering a school site.

## What the school can manage

| Area | School controls |
| --- | --- |
| Events | Create/edit/delete, cover image and alt text, date/time, location, category, draft/published, featured flag |
| Notices | Create/edit/delete, category, pinning, draft/published |
| Photo gallery | Albums, multi-photo upload, captions, ordering, album publishing, deletion |
| Learning programs | Names, age ranges, descriptions, symbols, ordering, visibility |
| Website settings | School name/logo/tagline, homepage heading and photos, story/mission, school statistics, contact details, admissions, social links |
| Family enquiries | Owner-only inbox, read/archive/delete, reply through the school’s email client |

Public visitors can browse upcoming/past events, download an event calendar file, read notices, explore photo albums, and send an admissions/contact enquiry.

## Clear, loosely coupled structure

```text
schoolsite/
├── client/                         # Presentation layer: React UI
│   ├── public/                     # Local fonts, favicon, demo photographs
│   └── src/
│       ├── components/             # Shared layout, cards, dialogs, form controls
│       ├── context/                # Auth, school settings, notifications
│       ├── hooks/                  # API loading and page helpers
│       ├── lib/                    # HTTP client, uploads, formatting
│       ├── pages/                  # Public pages
│       │   └── admin/              # School workspace and content editors
│       └── styles/                 # Theme, admin, responsive, contrast styles
├── server/                         # Node.js backend
│   ├── src/
│   │   ├── routes/                 # HTTP/controller layer; no SQL
│   │   ├── business/               # Application services / use-case orchestration
│   │   ├── logic/                  # Pure publishing, event-period, and slug rules
│   │   ├── domain/                 # Entities and repository/provider contracts
│   │   ├── validation/             # Zod input schemas at the boundary
│   │   ├── data/
│   │   │   ├── supabase/           # Supabase repository adapters + row mapping
│   │   │   └── demo/               # Interchangeable local repository adapters
│   │   ├── providers/              # ImageKit and local media adapters
│   │   ├── auth/                   # Supabase/Auth and demo session adapters
│   │   ├── middleware/             # Authentication, authorization, errors
│   │   ├── config/                 # Validated environment configuration
│   │   └── scripts/                # Owner-account provisioning
│   └── tests/                      # API, authorization, upload, and rule tests
├── supabase/migrations/            # PostgreSQL schema, RLS, indexes, initial settings
├── e2e/                            # Browser workflows tested with Playwright
├── docs/                           # Architecture, setup, API, selling, testing
├── .env.example                    # Configuration template; contains no real secrets
├── Dockerfile                      # Single-service production deployment
└── package.json                    # npm workspaces and root commands
```

**Dependency direction:** UI → HTTP API → business services → domain contracts ← data/image/auth adapters.

The business layer does not import Supabase or ImageKit SDKs. `business/container.ts` selects adapters at the composition root. Database rows use `snake_case`; application entities use `camelCase`, with mapping confined to the Supabase data layer.

See [Architecture](docs/ARCHITECTURE.md) for the request and image-upload flows.

## Connect your accounts

1. Create a Supabase project and run `supabase/migrations/202611030001_initial.sql`.
2. Create an ImageKit account and collect its public key, private key, and URL endpoint.
3. Copy `.env.example` to `.env`; set `APP_MODE=live` and fill the credentials.
4. Provision the first owner with `npm run admin:create`.
5. Restart, sign in, replace the starter school details, and test a real upload.

Full instructions, authentication settings, role grants, and troubleshooting are in [docs/SETUP.md](docs/SETUP.md).

## Commands

```bash
npm run dev             # React + Express development servers
npm run typecheck       # Strict TypeScript checks, both workspaces
npm test                # Backend/rules tests; no external services needed
npm run test:e2e        # Browser tests against an isolated demo instance
npm run build           # Compile API and build the React application
npm start               # Serve API + built frontend from one Node process
npm run format          # Format source with Prettier
npm run format:check    # Check formatting
npm run admin:create    # Provision a live Supabase owner; see setup guide
```

For production, set **both** `NODE_ENV=production` and `APP_MODE=live`. The server deliberately refuses to start with demo mode in production. After building, Express serves `client/dist` and `/api` on port 3001 by default.

## Security and operating boundaries

- Supabase secret key and ImageKit private key are **server-only**. No `VITE_` secret variables.
- Administrators need a valid Supabase user **and** an `admin_profiles` record.
- Owners control website settings and private enquiries; editors manage content and images.
- Browser image uploads use short-lived server-generated ImageKit authorization. Node verifies the uploaded file with ImageKit before accepting its metadata.
- JPEG, PNG, and WebP only; configurable file-size cap (default 5 MB), 40-megapixel limit, and content sniffing for demo uploads.
- Drafts and enquiries are not exposed by public endpoints. RLS also restricts direct browser database reads.
- Validation, authorization, rate limits, Helmet headers, bounded request bodies, and safe plain-text rendering are included.
- No student information system, grades, payments, attendance, or automated email delivery is included.
- Deleting content does **not** automatically delete its original image. This avoids breaking other references; use a deliberate media-cleanup process.
- Demo mode and the default rate limiter are intended for a **single Node instance**. Use a shared rate-limit store before scaling horizontally.

This is a substantial starter, not a security-certified or universally compliance-ready product. Review privacy, child-photo consent, accessibility, backups, and your hosting configuration before client launch.

## Selling one copy per school

See [the delivery playbook](docs/SELLING.md) for isolation, branding, handover, maintenance, and a launch checklist. Replace the demo photographs before publishing a real school website. Font licenses and photograph sources are listed in [Credits](docs/CREDITS.md).
