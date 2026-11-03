# Testing and release checks

## Automated checks

```bash
npm ci
npx playwright install chromium
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run format:check
npm audit --omit=dev
```

On a minimal Linux machine, Playwright may also need `npx playwright install-deps chromium`.

### Backend and pure-rule tests

The backend suite uses Node's test runner, Supertest, isolated in-memory demo repositories, and a mocked ImageKit metadata response. It covers:

- public configuration without server secrets
- published-only public content and empty filter controls
- missing/forged tokens and demo logout
- production refusal of demo mode
- draft → publish → edit → delete event flow
- stable event slugs and date/input validation
- preservation of announcement publication time
- owner/editor authorization boundaries
- website settings updates
- large-album deletion in the demo adapter
- real image-byte sniffing and rejection of scripts disguised as images
- local demo upload persistence and retrieval
- ImageKit HMAC signature/expiry and cross-folder metadata rejection
- private enquiry creation, archive/delete, honeypot and email validation
- pure publication, event-period, and slug rules

### Browser tests

Playwright starts a separate API/frontend pair on ports 3101/5174 with in-memory demo data. It does not mutate the development demo on port 5173. Tests cover:

1. Public navigation, event filters, calendar action, gallery lightbox, and mobile menu.
2. Creating an illustrated event draft, publishing it, and finding it publicly.
3. Editing website identity and seeing the public header update.
4. Creating an album, uploading a photo, and publishing the album.
5. Submitting a family enquiry and reading it as the owner.
6. Axe WCAG 2 A/AA checks on key public/admin screens and the event editor.

Automated accessibility checks are useful but do not replace manual keyboard, screen-reader, zoom, and real-device testing.

### Database migration

The initial PostgreSQL migration has also been checked with a PostgreSQL syntax parser during development. Syntax parsing does not prove compatibility with a particular hosted project or replace running the migration and the connected acceptance test.

## What is not automatically proven

No real Supabase or ImageKit credentials were supplied. The automated suite therefore **does not prove a live vendor connection**, hosted RLS behavior, real ImageKit upload delivery, SMTP/password recovery, Docker deployment, or a particular hosting provider's proxy configuration.

Before client delivery, run the connected checklist in [SETUP.md](SETUP.md), including a real upload, direct anonymous database-read checks, role checks, and password recovery. Build and smoke-test the Docker image on your deployment platform if using Docker.

## Manual release pass

- Browse every public page at desktop and mobile widths.
- Test keyboard navigation, visible focus, Escape/Tab in dialogs, and 200% zoom.
- Try invalid forms, expired sessions, oversized images, unsupported files, and offline requests.
- Confirm a draft event/album cannot be retrieved through public routes.
- Confirm an editor receives 403 for owner settings and private enquiries.
- Check that the school’s real content replaces all fictional statistics and photographs.
- Verify HTTPS, SPA refresh fallback, health endpoint, backups, and vendor quotas.
- Review `npm audit --omit=dev`; assess advisories in actual runtime paths rather than treating a clean audit as a security guarantee.

## Reset only the local demo

Stop the development API, back up anything you want to keep, then remove `server/data/demo.json` and, if desired, `server/data/uploads/`. Restart to reseed fictional content. **Never use this reset procedure on live Supabase/ImageKit data.**

## Verification record — 2026-11-03

Verified in the development workspace with Node.js 20.20.2 and npm 10.8.2:

- `npm run typecheck`: passed for server and client.
- `npm test`: **19/19 passed**.
- `npm run test:e2e`: **6/6 passed**, including the axe accessibility flow.
- `npm run build`: passed; no Vite chunk-size warning.
- `npm run format:check`: passed.
- `npm audit` and `npm audit --omit=dev`: **0 reported vulnerabilities** at verification time.
- Built-server smoke test in explicitly non-production demo mode: public pages, admin SPA refresh, API endpoints, local fonts, favicon, and images returned successfully.
- Production guard: `NODE_ENV=production APP_MODE=demo` correctly refused to start.

Not executed here: Docker image build (Docker was unavailable), and connected acceptance tests against real Supabase/ImageKit accounts. Re-run audits and the full checklist when dependencies, hosting, or vendor configuration change.
