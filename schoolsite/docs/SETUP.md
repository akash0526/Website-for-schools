# Connect Supabase and ImageKit, then deploy

The demo needs no accounts. These steps switch the same application to real services.

## 1. Create an isolated school project

Create a **new Supabase project for this school**. Do not share the demo school's database with another client.

In the project's SQL editor, run the entire file:

```text
supabase/migrations/202611030001_initial.sql
```

Alternatively, link the Supabase CLI to your project and run `supabase db push`. Run the initial migration once on a new project; use additional migrations for later schema changes.

The migration creates:

- `admin_profiles`, `school_settings`, `events`, `announcements`, `programs`, `albums`, `photos`, `inquiries`
- foreign keys, checks, updated-at triggers, and query indexes
- RLS with published-only public reads and no public enquiry reads
- one neutral settings row and three draft learning programs

It does **not** insert fictional events, gallery photos, or an administrator password.

## 2. Collect Supabase configuration

Open the project's **Connect** dialog / API settings:

- Project URL → `SUPABASE_URL`
- Publishable key (`sb_publishable_...`) → `SUPABASE_PUBLISHABLE_KEY`
- Secret key (`sb_secret_...`) → `SUPABASE_SECRET_KEY`

Legacy `anon` and `service_role` JWT keys also work with the installed Supabase client, but prefer the newer publishable/secret keys.

The publishable key is safe in the browser. The **secret key bypasses RLS** and must remain only in the Node server's environment. Never rename it to a `VITE_` variable.

## 3. Configure administrator sign-in

In Supabase Authentication settings:

1. Enable the Email provider.
2. Disable public signups if only invited school staff should have accounts.
3. Set the production **Site URL** to `https://your-school-domain.example`.
4. Add the exact password-recovery redirect URL: `https://your-school-domain.example/admin/reset-password`.
5. For local live testing, also allow `http://localhost:5173/admin/reset-password`.
6. Configure custom SMTP before relying on recovery emails for a production school. Built-in email delivery can be restricted/rate-limited.

Creating an `auth.users` record alone does not grant CMS access. The user must also have an `admin_profiles` row.

## 4. Configure ImageKit

In ImageKit, open the developer/API-key settings and collect:

- Public key → `IMAGEKIT_PUBLIC_KEY`
- Private key → `IMAGEKIT_PRIVATE_KEY`
- URL endpoint → `IMAGEKIT_URL_ENDPOINT`, for example `https://ik.imagekit.io/your_id`

Choose a separate upload folder for the school:

```text
/sunrise-school/uploads
```

Set `IMAGEKIT_UPLOAD_FOLDER` to that path, with a leading slash and no trailing slash. ImageKit creates the folder on upload. The backend checks this folder when verifying uploaded files.

For a stronger client isolation boundary, use a separate ImageKit account per client. Folder separation alone is not a promise that an administrator with upload authorization cannot choose another folder; it is an application-level verification boundary, not a separate vendor account boundary.

Do not enable unrestricted public uploads. The app generates short-lived upload signatures only for authenticated staff.

## 5. Create the local environment file

From the repository root:

```bash
cp .env.example .env
```

Set at least:

```dotenv
APP_MODE=live
NODE_ENV=development
PORT=3001
CLIENT_ORIGINS=http://localhost:5173
SCHOOL_SLUG=sunrise-school
TRUST_PROXY=0

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
SUPABASE_SECRET_KEY=sb_secret_YOUR_KEY

IMAGEKIT_PUBLIC_KEY=public_YOUR_KEY
IMAGEKIT_PRIVATE_KEY=private_YOUR_KEY
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/YOUR_IMAGEKIT_ID
IMAGEKIT_UPLOAD_FOLDER=/sunrise-school/uploads
MAX_UPLOAD_MB=5
```

Use your real values; the examples above are placeholders. Keep `.env` out of Git. In production, use your host's secret/environment manager instead of shipping a `.env` file.

`NODE_ENV=development` is useful for the first local live test. Production must use `NODE_ENV=production`. `APP_MODE=live` is the switch that selects Supabase/ImageKit rather than the demo adapters.

## 6. Provision the first owner

Run the migration and configure `.env` first. In a Bash terminal:

```bash
export ADMIN_EMAIL=principal@your-school.example
export ADMIN_NAME="School Principal"
read -s -p "Temporary password (12+ characters): " ADMIN_PASSWORD
export ADMIN_PASSWORD
echo
npm run admin:create
unset ADMIN_PASSWORD
```

The script creates a confirmed Supabase Auth user and an owner profile. It does not print the password. Share the temporary password through a secure channel and have the owner change it using password recovery. Remove temporary credentials from your environment after use.

For an **existing** Supabase Auth user, run this in the SQL editor after verifying the email address:

```sql
insert into public.admin_profiles (id, name, role)
select id, 'School Principal', 'owner'
from auth.users
where email = 'principal@your-school.example'
on conflict (id) do update
set name = excluded.name, role = excluded.role;
```

For a content editor, use the same pattern with the editor's verified email and `'editor'` instead of `'owner'`. Do not grant owner access to routine content-upload staff unless they need settings and private enquiries.

To revoke CMS access, delete that user's `admin_profiles` row and revoke/delete their Auth session/user as appropriate. A valid Auth login without a profile cannot use the admin API.

## 7. Run and perform a live acceptance test

```bash
npm install
npm run dev
```

Open `http://localhost:5173/admin/login`, sign in with the owner account, and verify:

- [ ] Dashboard loads the real Supabase settings.
- [ ] Website settings can change the school name, tagline, contact details, and homepage images.
- [ ] A new event defaults to draft and is absent from public event endpoints.
- [ ] Publishing the event makes it visible on the public site.
- [ ] A JPEG/PNG/WebP upload appears in the configured ImageKit folder.
- [ ] The saved image URL is the provider's canonical URL, and its file ID is stored in PostgreSQL.
- [ ] An album can receive multiple photos, captions, and a cover.
- [ ] Unpublishing the album hides both album and photos from public endpoints.
- [ ] An editor cannot open/save owner settings or read enquiries through the API.
- [ ] A contact enquiry is stored privately and visible only to the owner.
- [ ] Password recovery returns to `/admin/reset-password` and allows a new password.
- [ ] Browser source/network configuration contains no Supabase secret or ImageKit private key.
- [ ] School content, statistics, policies, and photo permissions have been reviewed.

The repository's automated tests do not substitute for this connected test: they use local adapters and a mocked ImageKit metadata response.

## 8. Build and deploy one Node service

```bash
npm ci
npm run build
NODE_ENV=production APP_MODE=live npm start
```

Express serves the built React app and API together on `PORT` (default 3001). Configure your host to route the school's domain to that port and provide HTTPS.

Production environment should include:

```dotenv
NODE_ENV=production
APP_MODE=live
CLIENT_ORIGINS=https://your-school-domain.example
TRUST_PROXY=1
```

Set `TRUST_PROXY=1` only when exactly one trusted reverse proxy sits in front of Node. Use the correct hop count for your host; do not blindly trust arbitrary forwarded headers on a directly exposed server.

### Docker

```bash
docker build -t school-site .
docker run --rm -p 3001:3001 --env-file .env.production school-site
```

The Docker image runs as the non-root `node` user and includes a health check at `/api/health`. Supply real production environment values; do not bake secrets into image layers. The image expects persistent data to live in Supabase/ImageKit, not the container filesystem.

### Separate frontend/backend hosting

The default delivery is one Node service. If hosting React separately, build and deploy `client/dist`, route `/api/*` to the Node service, and set the backend's allowed client origin. Do not put a localhost URL in browser-facing production code. The included Vite proxy is for development only.

### SPA hosting rule

For a single-service deployment, Express already handles client-side route fallback. If using a static frontend host, configure its SPA fallback to `index.html`, while excluding `/api/*`. Otherwise refreshing `/events/...` or `/admin/events` can return a host-level 404.

## 9. Operations

- **Backups:** choose a Supabase plan/backup policy appropriate to the client contract. Test restoration, not just backup existence.
- **Images:** back up or export ImageKit originals according to the client's retention agreement.
- **Updates:** keep dependencies patched and rerun tests before client deployments.
- **Monitoring:** monitor `/api/health`, API 5xx responses, authentication failures, and provider quota/bandwidth usage.
- **Scaling:** replace the in-memory rate limiter with a shared store before running multiple API instances. Demo JSON storage is never a production database.
- **Time:** event instants are stored in UTC. The editor and visitors currently see dates in their device's local time zone; the UI labels this. A school-wide time-zone setting is a sensible next enhancement for international audiences.
- **Email:** enquiries are saved, not automatically emailed. Add a notification provider only after configuring sender identity, spam protection, and privacy requirements.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Startup says a live-mode key is missing | Fill every Supabase/ImageKit value and set `APP_MODE=live`. |
| Demo blocked in production | Intentional safety check. Connect live services; do not work around it for a client site. |
| 401 after successful Supabase login | Confirm the user has an `admin_profiles` row in the same project. |
| Settings missing / database 503 | Run the migration and verify the project URL/secret key. |
| Image upload succeeds but save returns 422 | Confirm the file is in `IMAGEKIT_UPLOAD_FOLDER`, below the size/pixel limits, and a supported image type. |
| Image provider 502 | Check the private key, ImageKit service status, account quota, and outbound network access. |
| Recovery link fails | Check Supabase redirect allowlist, Site URL, SMTP, and whether the link was opened in the same browser. |
| CORS error in development | Use the Vite URL, not the API port, and include its origin in `CLIENT_ORIGINS`. |
| Public draft visible | Verify you are calling public endpoints and running the current service; inspect RLS and publication status. |

Official references: [Supabase server-side user verification](https://supabase.com/docs/reference/javascript/auth-getuser), [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [ImageKit uploads](https://imagekit.io/docs/api-reference/upload-file/upload-file).
