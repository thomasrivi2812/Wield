-- ---------------------------------------------------------------------------
-- Wield — schéma initial
-- À appliquer avec `supabase db push`, ou collé dans l'éditeur SQL Supabase.
--
-- Règle générale : RLS actif partout. Le navigateur ne lit que ce qui
-- appartient au compte connecté. Tout ce qui écrit un résultat d'audit ou un
-- achat passe par la clé de service, côté serveur uniquement.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- --- Comptes ---------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text,
  company     text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profil visible par son propriétaire" on public.profiles;
create policy "profil visible par son propriétaire"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "profil modifiable par son propriétaire" on public.profiles;
create policy "profil modifiable par son propriétaire"
  on public.profiles for update using (auth.uid() = id);

-- Crée le profil dès l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- Audits ----------------------------------------------------------------

-- `create type` n'accepte pas `if not exists` : on garde le script rejouable.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'audit_status') then
    create type public.audit_status as enum ('pending', 'running', 'done', 'error');
  end if;
  if not exists (select 1 from pg_type where typname = 'audit_tier') then
    create type public.audit_tier as enum ('free', 'report', 'action', 'seo');
  end if;
end
$$;

create table if not exists public.audits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users on delete set null,
  -- Jeton anonyme : permet de rattacher l'audit libre au compte créé ensuite.
  anon_id          text,
  query            text not null,
  status           public.audit_status not null default 'pending',
  tier             public.audit_tier   not null default 'free',
  -- Score brut : moteurs qui citent la marque / moteurs réellement mesurés.
  cited_count      int,
  measured_count   int,
  is_automatic     boolean not null default false,
  error            text,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create index if not exists audits_user_idx on public.audits (user_id, created_at desc);
create index if not exists audits_anon_idx on public.audits (anon_id, created_at desc);

alter table public.audits enable row level security;

drop policy if exists "audits visibles par leur propriétaire" on public.audits;
create policy "audits visibles par leur propriétaire"
  on public.audits for select using (auth.uid() = user_id);

-- Résultat par moteur.
create table if not exists public.audit_engines (
  id        bigint generated always as identity primary key,
  audit_id  uuid not null references public.audits on delete cascade,
  engine    text not null,   -- chatgpt | claude | perplexity | gemini
  -- cited | absent | error | not_configured | not_implemented
  status    text not null,
  detail    text,
  latency_ms int,
  unique (audit_id, engine)
);

alter table public.audit_engines enable row level security;

drop policy if exists "résultats moteur visibles avec l'audit" on public.audit_engines;
create policy "résultats moteur visibles avec l'audit"
  on public.audit_engines for select using (
    exists (
      select 1 from public.audits a
      where a.id = audit_id and a.user_id = auth.uid()
    )
  );

-- Résultat par question posée. C'est le niveau payant du rapport.
create table if not exists public.audit_prompts (
  id        bigint generated always as identity primary key,
  audit_id  uuid not null references public.audits on delete cascade,
  engine    text not null,
  prompt    text not null,
  cited     boolean not null,
  position  int,
  winners   text[] not null default '{}',
  sources   jsonb  not null default '[]'::jsonb,
  answer    text
);

create index if not exists audit_prompts_audit_idx on public.audit_prompts (audit_id);

alter table public.audit_prompts enable row level security;

drop policy if exists "détail des prompts visible avec l'audit" on public.audit_prompts;
create policy "détail des prompts visible avec l'audit"
  on public.audit_prompts for select using (
    exists (
      select 1 from public.audits a
      where a.id = audit_id and a.user_id = auth.uid()
    )
  );

-- --- Achats ----------------------------------------------------------------

create table if not exists public.purchases (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users on delete cascade,
  audit_id           uuid references public.audits on delete set null,
  sku                text not null,   -- report_geo | audit_seo_geo | guide_* | pack | brief
  amount_cents       int  not null,
  currency           text not null default 'eur',
  status             text not null default 'pending',  -- pending | paid | refunded
  stripe_session_id  text unique,
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);

create index if not exists purchases_user_idx on public.purchases (user_id, created_at desc);

alter table public.purchases enable row level security;

drop policy if exists "achats visibles par leur propriétaire" on public.purchases;
create policy "achats visibles par leur propriétaire"
  on public.purchases for select using (auth.uid() = user_id);

-- --- Discussion avec l'équipe ----------------------------------------------

create table if not exists public.threads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  thread_id   uuid not null references public.threads on delete cascade,
  author      text not null,   -- user | team
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists messages_thread_idx on public.messages (thread_id, created_at);

alter table public.threads  enable row level security;
alter table public.messages enable row level security;

drop policy if exists "fil visible par son propriétaire" on public.threads;
create policy "fil visible par son propriétaire"
  on public.threads for select using (auth.uid() = user_id);

drop policy if exists "messages visibles par le propriétaire du fil" on public.messages;
create policy "messages visibles par le propriétaire du fil"
  on public.messages for select using (
    exists (
      select 1 from public.threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "le propriétaire peut écrire dans son fil" on public.messages;
create policy "le propriétaire peut écrire dans son fil"
  on public.messages for insert with check (
    author = 'user'
    and exists (
      select 1 from public.threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  );

-- --- Demandes d'infrastructure web -----------------------------------------

create table if not exists public.infra_requests (
  id          uuid primary key default gen_random_uuid(),
  company     text not null,
  email       text not null,
  besoin      text,
  etat        text,
  horizon     text,
  detail      text,
  created_at  timestamptz not null default now()
);

alter table public.infra_requests enable row level security;
-- Aucune politique de lecture : seule la clé de service y accède.

-- --- Limitation de débit ---------------------------------------------------
-- Volontairement en Postgres plutôt que chez un tiers : une dépendance de
-- moins, et les compteurs restent dans la même base européenne.

create table if not exists public.rate_limits (
  bucket        text        not null,
  window_start  timestamptz not null,
  count         int         not null default 0,
  primary key (bucket, window_start)
);

alter table public.rate_limits enable row level security;
-- Aucune politique : réservé à la clé de service.

-- Incrémente et dit si la requête passe. Atomique : deux appels simultanés
-- ne peuvent pas dépasser la limite.
create or replace function public.consume_rate_limit(
  p_bucket text,
  p_limit  int,
  p_window interval
)
returns table (allowed boolean, remaining int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count        int;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / extract(epoch from p_window))
    * extract(epoch from p_window)
  );

  insert into public.rate_limits (bucket, window_start, count)
  values (p_bucket, v_window_start, 1)
  on conflict (bucket, window_start)
    do update set count = public.rate_limits.count + 1
  returning public.rate_limits.count into v_count;

  return query select v_count <= p_limit, greatest(p_limit - v_count, 0);
end;
$$;

-- Purge des fenêtres expirées, à brancher sur pg_cron si besoin.
create or replace function public.purge_rate_limits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
$$;
