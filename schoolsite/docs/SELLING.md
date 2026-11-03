# Selling and delivering school websites

## A practical offer

Sell a **school website setup package** plus an optional **care plan**, rather than promising unlimited software development for a one-time fee.

### Setup package

- Discovery: school name, logo, colors, contact details, programs, admissions process.
- Brand adaptation and replacement of all demo content/photographs.
- Separate Supabase project, ImageKit storage, domain, HTTPS, and hosting setup.
- Initial events, notices, programs, and approved gallery albums.
- Owner/editor account setup and a staff training session.
- A short school-specific content guide and handover record.

### Optional care plan

- Hosting/vendor coordination, backups and restore checks, dependency updates.
- Uptime monitoring and a defined support response time.
- A fixed allowance of content/design changes per month.
- Quarterly permission, privacy, and broken-link reviews.
- Clear rates for work outside the agreed scope.

Price based on your market, support obligations, customization time, and actual vendor costs. Do not assume Supabase, ImageKit, email, or hosting are free at production scale. Check current plans and quotas before quoting.

## Recommended client isolation

For each school:

```text
Client repository / release branch
  → separate Node deployment
  → separate domain
  → separate Supabase project and keys
  → separate ImageKit account or controlled upload folder
  → separate owner/editor accounts
```

Never point two clients at the same single-school database. Never reuse a production secret key across schools. Keep a client inventory recording where the domain, database, images, backups, and administrator accounts live.

If a client owns their accounts, have them create the accounts and invite you with appropriate access. If you manage accounts for them, document ownership, billing responsibility, export rights, and what happens when the contract ends.

## Customize without coupling content to code

1. Start in **Website settings** for identity, logo, homepage, story, mission, statistics, admissions, contact, and social links.
2. Edit **Learning programs** for the school's actual stages and age ranges.
3. Replace the theme tokens in `client/src/styles/index.css` for each client's brand. Keep the contrast and responsive styles under review.
4. Adjust static design copy in the public page components where needed (for example, the school's value statements).
5. Replace the favicon and local font/photograph assets as appropriate.
6. Keep content changes in the admin panel; do not hardcode new events or gallery URLs into React.

For many clients, maintain a common template repository and a small per-client theme/content configuration. Avoid editing core business logic separately for every school unless the contract explicitly covers a custom feature.

## What is included—and what is not

Included: public content website, events, notices, programs, galleries, school settings, private enquiries, role-based admin access, upload integration, database schema, tests, and deployment documentation.

Not included: multi-school tenancy, subscription billing, student records, attendance, gradebooks, fee payments, parent portals, SMS, automated email campaigns, native mobile apps, or arbitrary page-building.

The enquiry form is not an admissions application workflow. It does not reserve a place, take payments, or guarantee a response time.

## Privacy and child safety

A school site often contains children's photographs and families' personal details. Before launch:

- Obtain the school's approval and appropriate guardian consent for identifiable photographs.
- Avoid publishing full names, addresses, schedules, or sensitive student details in captions.
- Collect only the enquiry information the school actually needs.
- Publish the school's real privacy notice and contact route; this template does not generate a legally sufficient privacy policy for every jurisdiction.
- Define how long enquiries and images are retained, and how removal requests are handled.
- Restrict owner access to private enquiries; use individual staff accounts rather than a shared login.
- Agree on a process for taking down a photograph quickly.
- Review the laws and school policies applicable to the client's location. This project is not legal advice or a compliance certification.

## Handover packet

Give the client:

- Website URL and administrator sign-in URL.
- Individual owner account and a secure password-setting/recovery process.
- A one-page “add an event / upload photos / publish a notice” guide.
- Explanation of draft vs published, album visibility, alt text, and image consent.
- Account/ownership and billing summary, without exposing secrets in ordinary documentation.
- Backup/restore and support contact details.
- Scope, update allowance, and change-request process.
- Export/deletion terms at contract termination.

Keep server secret keys in the hosting secret manager, not in a PDF, source repository, or client chat message.

## Launch checklist

### Content and brand

- [ ] School name, logo, favicon, title, tagline, and colors are correct.
- [ ] All fictional statistics, stories, staff names, contact details, and events are removed/replaced.
- [ ] Real programs, admissions information, office hours, and social links are approved.
- [ ] Demo photographs are replaced or properly licensed for the client's use.
- [ ] Image alt text and photo permissions are reviewed.
- [ ] Privacy/contact information and required school disclosures are approved.

### Technical

- [ ] `APP_MODE=live`, `NODE_ENV=production`, HTTPS, correct origins and proxy hops.
- [ ] Separate school database and image folder/account; migration applied.
- [ ] Owner/editor permissions tested through the API, not just by hiding buttons.
- [ ] Real Supabase login, recovery, database writes, and ImageKit uploads tested.
- [ ] Secret keys absent from frontend bundles, Git history, logs, and screenshots.
- [ ] Draft and enquiry privacy tested with anonymous requests and direct database keys.
- [ ] Backups configured and a restoration test scheduled/performed.
- [ ] Current dependency audit and production build reviewed.
- [ ] Mobile layouts, keyboard navigation, forms, and key pages checked.
- [ ] Monitoring, vendor quotas, billing alerts, and support responsibility agreed.

### Commercial

- [ ] Ownership/license of custom work and third-party assets is clear.
- [ ] Scope, acceptance criteria, revision allowance, and payment milestones are written down.
- [ ] Care-plan response times and exclusions are agreed.
- [ ] Client has received training and accepted the handover.

## Sensible next features after the first sale

Prioritize what paying schools actually request: school-wide time-zone settings, email notifications, an audit trail, a media-library cleanup tool, multilingual content, SEO/server rendering, and a managed multi-tenant control plane. Each is a separate scope—not an assumed part of this starter.
