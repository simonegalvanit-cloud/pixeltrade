-- perpy database. Paste all of this into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
--
-- Only perpy's server talks to the database (with the secret key). Row Level
-- Security is switched on with no rules, which blocks everyone else, including
-- anyone holding the public "publishable" key.

-- Posts: a trader's call, optionally with one of their open positions attached.
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author text not null check (author ~ '^0x[0-9a-f]{40}$'),
  body text not null check (char_length(body) between 1 and 500),
  coin text check (coin is null or char_length(coin) <= 24),
  side smallint check (side in (-1, 1)),
  lev integer check (lev is null or lev between 1 and 200),
  entry_px double precision,
  size_usd double precision,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on posts (created_at desc);
create index if not exists posts_author_idx on posts (author, created_at desc);

-- Follows ("tailing"): follower tails followee.
create table if not exists follows (
  follower text not null check (follower ~ '^0x[0-9a-f]{40}$'),
  followee text not null check (followee ~ '^0x[0-9a-f]{40}$'),
  created_at timestamptz not null default now(),
  primary key (follower, followee),
  check (follower <> followee)
);
create index if not exists follows_followee_idx on follows (followee);

-- GGs (likes). target is what was GG'd: "post:<id>", "pos:<wallet>:<coin>" or "trade:<wallet>:<id>".
create table if not exists ggs (
  user_addr text not null check (user_addr ~ '^0x[0-9a-f]{40}$'),
  target text not null check (char_length(target) <= 120),
  created_at timestamptz not null default now(),
  primary key (user_addr, target)
);
create index if not exists ggs_target_idx on ggs (target);

-- Chat messages under a post, position or trade.
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  target text not null check (char_length(target) <= 120),
  author text not null check (author ~ '^0x[0-9a-f]{40}$'),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists comments_target_idx on comments (target, created_at);

alter table posts enable row level security;
alter table follows enable row level security;
alter table ggs enable row level security;
alter table comments enable row level security;

-- GG counts for many targets at once.
create or replace function gg_counts(targets text[])
returns table (target text, n bigint)
language sql stable
as $$ select g.target, count(*) from ggs g where g.target = any(targets) group by g.target $$;

-- How many people tail a wallet, and how many it tails.
create or replace function follow_counts(addr text)
returns table (followers bigint, following bigint)
language sql stable
as $$ select (select count(*) from follows where followee = addr), (select count(*) from follows where follower = addr) $$;

revoke execute on function gg_counts(text[]) from public;
revoke execute on function follow_counts(text) from public;
grant execute on function gg_counts(text[]) to service_role;
grant execute on function follow_counts(text) to service_role;
