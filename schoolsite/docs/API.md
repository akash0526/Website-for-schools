# HTTP API contract

Base path: `/api`. JSON successes are wrapped in `data`. Deletes return 204. The browser uses relative URLs; Vite proxies development requests to Node.

## Public endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Process liveness and mode; not a full vendor connectivity check |
| GET | `/config` | Public app mode and Supabase URL/publishable key when live |
| GET | `/settings` | Public school identity, homepage, contact, admissions, social details |
| GET | `/home` | Settings plus upcoming events, notices, programs, albums, gallery preview |
| GET | `/events` | Published events; `period=upcoming|past|all` |
| GET | `/events/:slug` | One published event |
| GET | `/announcements` | Published notices, pinned first |
| GET | `/announcements/:id` | One published notice |
| GET | `/programs` | Published programs in display order |
| GET | `/albums` | Published album summaries and photo counts |
| GET | `/albums/:id` | Published album and first 100 photos |
| GET | `/albums/:id?page=2` | Subsequent page of photos from a published album |
| POST | `/inquiries` | Create a private family enquiry |

Collection parameters: `page` (default 1), `limit` (default 50, max 100), `search` (title), and `status` where relevant. Public content use cases always enforce published visibility, regardless of a requested status. Events additionally accept `category=Academic|Community|Sports|Arts|Celebration`.

An event is considered upcoming until its start instant; use the past/all filters for archives. Multi-day events remain available through their stable detail URL and the all-events listing.

Example list response:

```json
{
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "limit": 12
  }
}
```

## Authentication

Live staff sign-in/password recovery uses the Supabase client in the browser. Send the resulting access token to Node:

```http
Authorization: Bearer <supabase-access-token>
```

Node validates the token with Supabase Auth and requires an administrator profile. Do not send the Supabase secret key as a bearer token.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/admin/auth/demo` | Demo only: create an expiring fictional-owner session |
| GET | `/admin/auth/me` | Current verified administrator and role |
| POST | `/admin/auth/logout` | Revoke a demo session; live clients also sign out through Supabase |

The demo endpoint returns `{ data: { token, user } }`. It does not exist in live mode.

## Protected content endpoints

All endpoints below require a valid administrator token. Owner-only restrictions are noted.

| Method | Path | Role |
| --- | --- | --- |
| GET | `/admin/dashboard` | Owner/editor |
| GET, POST | `/admin/events` | Owner/editor |
| GET, PATCH, DELETE | `/admin/events/:id` | Owner/editor |
| GET, POST | `/admin/announcements` | Owner/editor |
| GET, PATCH, DELETE | `/admin/announcements/:id` | Owner/editor |
| GET, POST | `/admin/programs` | Owner/editor |
| GET, PATCH, DELETE | `/admin/programs/:id` | Owner/editor |
| GET, POST | `/admin/albums` | Owner/editor |
| GET, PATCH, DELETE | `/admin/albums/:id` | Owner/editor |
| GET | `/admin/albums/:id/photos?page=1` | Owner/editor; includes draft albums |
| POST | `/admin/photos` | Owner/editor |
| GET, PATCH, DELETE | `/admin/photos/:id` | Owner/editor |
| POST | `/admin/uploads/authorize` | Owner/editor |
| POST | `/admin/uploads/verify` | Owner/editor; ImageKit mode |
| POST | `/admin/uploads` | Owner/editor; demo multipart upload only |
| GET, PATCH | `/admin/settings` | Owner only |
| GET | `/admin/inquiries` | Owner only |
| PATCH, DELETE | `/admin/inquiries/:id` | Owner only |

PATCH accepts partial editable fields. Server-owned IDs, timestamps, event slugs, and publication timestamps are not editable through content PATCH requests. An event slug is generated once and retained when its title changes.

### Create an event

```http
POST /api/admin/events
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "title": "School Open Day",
  "description": "Meet our teachers and explore the campus.",
  "category": "Community",
  "startsAt": "2026-12-12T09:00:00.000Z",
  "endsAt": "2026-12-12T12:00:00.000Z",
  "location": "Main campus",
  "coverImage": null,
  "featured": false,
  "status": "draft"
}
```

Use a real future date when creating your event. Dates are ISO 8601 instants; the UI converts the device-local editor input to UTC. The example is a payload illustration, not seeded content.

Publish with:

```json
{ "status": "published" }
```

### Other editable shapes

- **Announcement:** `title`, `body`, `category`, `pinned`, `status`.
- **Program:** `title`, `ageRange`, `description`, `icon` (`sprout|book|compass`), `sortOrder`, `status`.
- **Album:** `title`, `description`, `eventDate` (`YYYY-MM-DD`), `coverImage`, `status`.
- **Photo:** `albumId`, `caption`, `image`, `sortOrder`.
- **Inquiry update:** `status` (`new|read|archived`) only.
- **Settings:** any editable subset of the school identity, homepage, about, statistics, contact, admissions, and social fields. See `validation/schemas.ts` for exact limits.

### Media object

```json
{
  "url": "https://ik.imagekit.io/your-id/school/uploads/photo.jpg",
  "thumbnailUrl": "https://ik.imagekit.io/your-id/tr:n-ik_ml_thumbnail/school/uploads/photo.jpg",
  "provider": "imagekit",
  "fileId": "provider-file-id",
  "width": 1600,
  "height": 1000,
  "alt": "Students working on a classroom project"
}
```

Obtain this object through the upload flow; do not fabricate provider IDs. The server verifies new live images and uses provider-canonical metadata.

### Upload authorization

`POST /admin/uploads/authorize` returns either a direct ImageKit plan or a demo server-upload plan.

Direct plan fields: `mode`, `uploadUrl`, `publicKey`, `folder`, `token`, `expire`, `signature`, `maxBytes`, `allowedMimeTypes`.

Send the file and those fields as multipart form data to the supplied ImageKit upload URL, with `useUniqueFileName=true` and `overwriteFile=false`. Then send `{ "fileId": "..." }` to `/admin/uploads/verify`. Save the returned media object on the content record.

Demo plan fields: `mode=server`, `uploadUrl`, `maxBytes`, `allowedMimeTypes`. POST multipart field `file` to that URL. Both paths return the same media shape.

## Family enquiry payload

```json
{
  "name": "Parent name",
  "email": "parent@example.com",
  "phone": "",
  "studentGrade": "Grade 3",
  "message": "We would like to arrange a visit.",
  "website": ""
}
```

`website` is a honeypot and must remain empty. The endpoint is rate-limited per IP. The response contains a receipt ID, not the private enquiry list. There is no public GET endpoint for enquiries.

## Errors and limits

See [Architecture](ARCHITECTURE.md#7-error-and-response-contract) for the error envelope. JSON bodies are limited to 100 KB. Image uploads default to 5 MB, configurable from 1–10 MB, with a 40-megapixel limit. Only JPEG, PNG, and WebP are accepted. Gallery UI uploads at most 10 selected files per batch.

General API, sign-in, upload, and enquiry endpoints have separate rate limits. The included limiter is process-local; use a shared store for horizontally scaled production deployments.
