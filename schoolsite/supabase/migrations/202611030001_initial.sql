-- SchoolSite: one isolated Supabase project per school.
-- Run once in the Supabase SQL editor or with `supabase db push`.
begin;

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  role text not null check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);
create table public.school_settings (
  id text primary key default 'main' check (id = 'main'),
  name text not null check (length(name) between 1 and 120),
  short_name text not null check (length(short_name) between 1 and 35),
  tagline text not null, hero_title text not null, hero_subtitle text not null,
  hero_image jsonb, about_title text not null, about_text text not null, mission text not null,
  about_image jsonb, logo jsonb,
  established_year integer not null check (established_year between 1800 and 2200),
  student_count integer not null default 0 check (student_count >= 0),
  teacher_count integer not null default 0 check (teacher_count >= 0),
  email text not null, phone text not null, address text not null, office_hours text not null,
  admissions_open boolean not null default false, admissions_text text not null,
  facebook_url text not null default '', instagram_url text not null default '', youtube_url text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (hero_image is null or jsonb_typeof(hero_image) = 'object'),
  check (about_image is null or jsonb_typeof(about_image) = 'object'),
  check (logo is null or jsonb_typeof(logo) = 'object')
);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 140), slug text not null unique,
  description text not null check (length(description) between 1 and 12000),
  category text not null check (category in ('Academic', 'Community', 'Sports', 'Arts', 'Celebration')),
  starts_at timestamptz not null, ends_at timestamptz,
  location text not null, cover_image jsonb, featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at), check (cover_image is null or jsonb_typeof(cover_image) = 'object')
);
create table public.announcements (
  id uuid primary key default gen_random_uuid(), title text not null check (length(title) between 1 and 160),
  body text not null check (length(body) between 1 and 12000),
  category text not null check (category in ('Notice', 'Admissions', 'Academic', 'General')),
  pinned boolean not null default false, status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.programs (
  id uuid primary key default gen_random_uuid(), title text not null check (length(title) between 1 and 100),
  age_range text not null, description text not null check (length(description) between 1 and 1500),
  icon text not null check (icon in ('sprout', 'book', 'compass')), sort_order integer not null default 0 check (sort_order >= 0),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.albums (
  id uuid primary key default gen_random_uuid(), title text not null check (length(title) between 1 and 140),
  description text not null default '', event_date date not null, cover_image jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (cover_image is null or jsonb_typeof(cover_image) = 'object')
);
create table public.photos (
  id uuid primary key default gen_random_uuid(), album_id uuid not null references public.albums(id) on delete cascade,
  caption text not null default '', image jsonb not null check (jsonb_typeof(image) = 'object'),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.inquiries (
  id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 1 and 100),
  email text not null check (length(email) <= 254), phone text not null default '', student_grade text not null default '',
  message text not null check (length(message) between 1 and 3000),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index events_status_starts_idx on public.events(status, starts_at);
create index announcements_published_idx on public.announcements(status, pinned desc, published_at desc);
create index programs_status_order_idx on public.programs(status, sort_order);
create index albums_status_date_idx on public.albums(status, event_date desc);
create index photos_album_order_idx on public.photos(album_id, sort_order, created_at);
create index inquiries_status_created_idx on public.inquiries(status, created_at desc);

do $$
declare table_name text;
begin
  for table_name in select unnest(array['school_settings','events','announcements','programs','albums','photos','inquiries']) loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;
end $$;

-- A security-definer helper avoids recursive RLS evaluation on admin_profiles.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_profiles where id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated, service_role;

alter table public.admin_profiles enable row level security;
alter table public.school_settings enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;
alter table public.programs enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.inquiries enable row level security;

create policy profiles_read_own on public.admin_profiles for select to authenticated using (id = (select auth.uid()));
create policy settings_read_public on public.school_settings for select to anon, authenticated using (true);
create policy events_read_published on public.events for select to anon, authenticated using (status = 'published' or (select public.is_admin()));
create policy announcements_read_published on public.announcements for select to anon, authenticated using (status = 'published' or (select public.is_admin()));
create policy programs_read_published on public.programs for select to anon, authenticated using (status = 'published' or (select public.is_admin()));
create policy albums_read_published on public.albums for select to anon, authenticated using (status = 'published' or (select public.is_admin()));
create policy photos_read_published on public.photos for select to anon, authenticated using (
  exists(select 1 from public.albums a where a.id = album_id and (a.status = 'published' or (select public.is_admin())))
);
-- No public policies on inquiries: even a valid browser key cannot read private enquiries.
-- All CMS writes and enquiry submissions go through the authorized Node API.
-- No browser write policies: the backend validates input and uses the server-only secret key.
revoke all on public.admin_profiles, public.school_settings, public.events, public.announcements,
  public.programs, public.albums, public.photos, public.inquiries from anon, authenticated;
grant select on public.admin_profiles to authenticated;
grant select on public.school_settings, public.events, public.announcements, public.programs, public.albums, public.photos to anon, authenticated;
grant all on public.admin_profiles, public.school_settings, public.events, public.announcements,
  public.programs, public.albums, public.photos, public.inquiries to service_role;

-- Neutral starting content. Replace it in Website settings before opening a live site.
insert into public.school_settings (
  name, short_name, tagline, hero_title, hero_subtitle, about_title, about_text, mission,
  established_year, email, phone, address, office_hours, admissions_text
) values (
  'Your School', 'your school', 'A place to learn. A place to belong.',
  E'Big dreams.\nBright futures.\nA place to belong.',
  'Welcome to our school. Discover a community where every child is encouraged to learn, grow, and thrive.',
  'More than a school. A place to grow.',
  'Tell your school’s story here. Share your values, meet your community, and help families get to know you.',
  'Add your school’s mission here.', extract(year from now())::integer,
  'hello@example.com', 'Add your school phone number', 'Add your school address', 'Add your office hours',
  'Tell families how to arrange a visit and learn about admissions.'
);
insert into public.programs(title, age_range, description, icon, sort_order, status) values
  ('Early Years', 'Ages 3–5', 'A joyful foundation built on play, curiosity, and caring relationships.', 'sprout', 1, 'draft'),
  ('Primary School', 'Ages 6–11', 'Growing confident learners through discovery, creativity, and connection.', 'book', 2, 'draft'),
  ('Secondary School', 'Ages 12–16', 'Wider horizons, deeper thinking, and the confidence to shape the future.', 'compass', 3, 'draft');
commit;
