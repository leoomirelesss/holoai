-- LOCAL HARNESS ONLY. Never a migration, seed for deployment, or Auth mock in the app.
-- PostgreSQL roles + auth.uid() contract, not a replacement for GoTrue/JWT validation.
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end; $$;
create schema auth;
create table auth.users (id uuid primary key, email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub', '')::uuid;
$$;
grant usage on schema auth, public to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
-- Mirror permissive Supabase defaults: the migration must explicitly revoke them.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
insert into auth.users(id, email_confirmed_at) values
  ('11111111-1111-4111-8111-111111111111', statement_timestamp()),
  ('22222222-2222-4222-8222-222222222222', statement_timestamp());
