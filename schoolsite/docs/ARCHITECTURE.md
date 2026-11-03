# Architecture and boundaries

## 1. Product model

**One school = one deployment + one Supabase project + one ImageKit upload folder.**

There is intentionally no `school_id` on every content row and no tenant-selection logic. A school cannot accidentally query another school's rows through this application because each deployment has its own database credentials. If you later want a shared SaaS, redesign tenant isolation, authorization, routing, storage isolation, and billing rather than simply adding a nullable `school_id`.

## 2. Layers

| Layer | Location | Responsibility | Must not do |
| --- | --- | --- | --- |
| Presentation | `client/src` | Forms, navigation, accessible UI, browser session, direct ImageKit file transfer | Contain secret keys or make authorization decisions as its only defense |
| HTTP/controllers | `server/src/routes` | Parse request inputs, select use cases, set HTTP status and response shape | Execute SQL or implement publishing rules |
| Business/application | `server/src/business` | Coordinate CRUD, verify media, enforce use-case preconditions, compose homepage data | Depend on a concrete database or image vendor |
| Pure logic | `server/src/logic` | Publishing timestamps, event-period filters, stable slug creation | Read environment variables, call HTTP, or query storage |
| Domain/contracts | `server/src/domain` | Entity shapes, repository interfaces, media/auth contracts | Import Express, Supabase, or ImageKit |
| Input validation | `server/src/validation` | Zod schemas, input limits, accepted fields, media shape | Trust a browser role or uploaded file URL |
| Data | `server/src/data` | Execute repository queries, pagination, map DB rows to entities | Decide who may publish or read an enquiry |
| Infrastructure | `providers`, `auth`, `config` | ImageKit/local files, token verification, environment configuration | Leak vendor credentials into UI responses |
| Composition root | `business/container.ts`, `app.ts`, `index.ts` | Choose concrete adapters and wire the application | Spread service construction through controllers |

Business rules and pure logic are separate directories so rules can be tested without a database. Business services orchestrate those rules and repository calls.

## 3. Content request

```text
React admin form
  → Zod validation on the server
  → Supabase Auth token verification
  → admin_profiles role lookup
  → ContentService / SchoolServices
  → pure content rules + media verification
  → Repository<T> contract
  → SupabaseRepository<T>
  → PostgreSQL
```

Public requests use the same business services but dedicated public use cases. Those use cases add `status = published` filters; public album detail also checks the parent album. There is no public route that returns the complete admin event list or enquiry inbox.

The backend uses the Supabase secret key only after its own authorization checks. RLS is a second line of defense for direct database access, not a replacement for API authorization.

## 4. Database model

```text
auth.users 1──1 admin_profiles
school_settings                  single row, id = 'main'
events                           independent content
announcements                    independent content
programs                         independent content
albums 1──N photos                FK with ON DELETE CASCADE
inquiries                        private contact/admissions messages
```

Media metadata is stored as JSONB on the content record. Image bytes are stored in ImageKit, **not Supabase Storage**. Storing a URL does not move the image into PostgreSQL.

Common fields: UUID `id`, `created_at`, `updated_at`. A trigger updates `updated_at`. Events also have a unique URL slug. Announcements have a separate `published_at`, preserved when an already-published notice is edited.

The Supabase adapter converts snake-case database columns to camel-case domain fields. JSONB media objects are opaque values and keep their application shape.

## 5. Image upload flow

```text
Administrator chooses a file
  → POST /api/admin/uploads/authorize (Bearer token required)
  → Node returns public key, unique token, expiry, HMAC signature, folder
  → Browser uploads the file directly to ImageKit
  → Browser sends only the returned fileId to /api/admin/uploads/verify
  → Node fetches file details from ImageKit using the private key
  → Node checks folder, image type, file size, dimensions, and secure URL
  → Node returns canonical MediaAsset metadata
  → Admin saves the content record through the normal CRUD endpoint
  → MediaService verifies new media again before persisting it
```

The browser never receives the ImageKit private key or Supabase secret key. A browser-supplied ImageKit URL is not trusted. New live media must pass provider verification; unchanged existing media can retain its stored metadata.

The upload signature authorizes an administrator to upload; it is not a public upload endpoint. The configured school folder is checked again during verification. Use a separate ImageKit account or carefully controlled account/folder policy when stronger administrative isolation is required.

In demo mode, the same UI receives a `server` upload plan instead. Multer receives one bounded file, checks its actual bytes and dimensions, and stores it under `server/data/uploads`. The UI does not need to know which storage adapter is active.

### Image lifecycle

- Replacing or deleting a content record does not immediately delete the image provider file.
- This is intentional: the same image may be reused, and a database deletion should not cause an irreversible media deletion without a recovery policy.
- Reconcile unused media periodically using provider file IDs referenced by settings, events, albums, and photos. Keep a grace period and a backup before deleting orphans.
- Failed/abandoned direct uploads can also leave orphan files.
- ImageKit transformations can generate thumbnails without storing a second original image. The current UI uses responsive image containers and the provider’s original/thumbnail URLs.

## 6. Authentication and roles

Live authentication uses Supabase email/password. The backend calls `auth.getUser(jwt)` to validate the token with Supabase Auth, then looks up `admin_profiles`. It does not trust `user_metadata.role` or a role sent in a request body.

| Capability | Owner | Editor |
| --- | --- | --- |
| Events, notices, programs, albums, photos | Yes | Yes |
| Image uploads | Yes | Yes |
| Website identity/homepage/contact settings | Yes | No |
| Private family enquiries | Yes | No |
| Grant another staff member access | Provisioning script / database administrator | No |

There is no public administrator signup. Provision staff deliberately. The browser may hide owner-only navigation, but the server independently enforces owner access.

Demo authentication uses random, expiring, in-memory bearer tokens and a fictional owner. It is unavailable in live mode. Demo mode cannot start when `NODE_ENV=production`.

## 7. Error and response contract

Successful JSON responses use `{ "data": ... }`. Delete operations return 204. Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the highlighted fields.",
    "details": {
      "fieldErrors": { "title": ["This field is required"] },
      "formErrors": []
    }
  }
}
```

The API returns 401 for missing/expired access, 403 for insufficient role, 404 for missing or non-public content, 413 for oversized uploads, 415 for invalid image bytes, 422 for validation, and 429 for rate limits. Vendor/database failures are mapped to safe messages; internal credentials are not returned.

Every API response includes a request ID. Request logs contain method, path, status, and duration—not authorization headers, passwords, enquiry messages, or image bytes.

## 8. Deliberate extension points

- Replace `MediaStorage` to use another image vendor without rewriting content forms.
- Replace repository adapters while preserving `Repository<T>` and `AlbumRepository` contracts.
- Add a new content type with a domain model, schema, table/migration, repository wiring, service, routes, and admin field configuration.
- Add email notifications behind a new provider contract after enquiry creation; do not put vendor keys in React.
- Add audit records in business services when changes must be attributable for client contracts.
- Add a transactional unit-of-work/outbox before introducing multi-record financial or student-record operations.

This starter favors understandable boundaries over a framework-heavy abstraction. It is suitable for a small school content site, not a student information system.
