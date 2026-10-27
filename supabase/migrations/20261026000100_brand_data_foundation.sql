-- Phase 1 only. Apply with the migration owner, never from a browser/session role.
-- All DDL and grants are atomic. No auth trigger, remote connection or seed data.
begin;

-- Fail on a namespace collision; never adopt an existing/untrusted schema.
create schema linde_private;
revoke all on schema linde_private from public, anon, authenticated, service_role;
grant usage on schema linde_private to authenticated;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  bootstrap_key text not null check (char_length(bootstrap_key) between 1 and 128),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  status text not null default 'active' check (status in ('active', 'deleting', 'deleted')),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (owner_user_id, bootstrap_key)
);
create unique index workspaces_one_live_owner on public.workspaces(owner_user_id) where status in ('active', 'deleting');
create index workspaces_status on public.workspaces(status);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('owner', 'member')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (workspace_id, user_id)
);
create unique index memberships_one_active_owner on public.memberships(workspace_id) where role = 'owner' and status = 'active';
create index memberships_user_status_workspace on public.memberships(user_id, status, workspace_id);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  website_url text,
  current_revision_id uuid,
  archived_at timestamptz,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (workspace_id, id),
  check (website_url is null or (char_length(website_url) <= 2048 and website_url ~ '^https://[^[:space:]/?#@]+([/?#][^[:space:]]*)?$'))
);
create index brands_workspace_archive_created on public.brands(workspace_id, archived_at, created_at, id);

create table public.brand_revisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  brand_id uuid not null,
  revision_number bigint not null check (revision_number > 0),
  profile_document jsonb not null,
  approval_status text not null default 'draft' check (approval_status in ('draft', 'approved', 'rejected')),
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  foreign key (workspace_id, brand_id) references public.brands(workspace_id, id) on delete cascade,
  unique (workspace_id, brand_id, id),
  unique (brand_id, revision_number),
  check ((approval_status = 'approved' and approved_by is not null and approved_at is not null)
    or (approval_status <> 'approved' and approved_by is null and approved_at is null)),
  check (jsonb_typeof(profile_document) = 'object' and octet_length(profile_document::text) <= 65536),
  check (updated_at = created_at)
);
alter table public.brands add constraint brands_current_revision_same_brand
  foreign key (workspace_id, id, current_revision_id)
  references public.brand_revisions(workspace_id, brand_id, id) on delete restrict;
create index brands_current_revision on public.brands(workspace_id, id, current_revision_id) where current_revision_id is not null;
create index brand_revisions_history on public.brand_revisions(workspace_id, brand_id, created_at, id);
create index brand_revisions_created_by on public.brand_revisions(created_by);
create index brand_revisions_approved_by on public.brand_revisions(approved_by) where approved_by is not null;

-- Server identities/times cannot be supplied through the mutation API. Protect
-- immutable IDs/context even from an accidental privileged UPDATE in future code.
create function linde_private.stamp_row() returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    NEW.id := gen_random_uuid();
    NEW.created_at := statement_timestamp();
  else
    if NEW.id is distinct from OLD.id or NEW.created_at is distinct from OLD.created_at then
      raise exception using errcode = '23514', message = 'Immutable identity';
    end if;
    if TG_TABLE_NAME <> 'workspaces' then
      if NEW.workspace_id is distinct from OLD.workspace_id then
        raise exception using errcode = '23514', message = 'Immutable tenant';
      end if;
    end if;
    if TG_TABLE_NAME = 'brand_revisions' then
      if OLD.approval_status <> 'draft' or NEW.approval_status not in ('approved', 'rejected')
        or NEW.brand_id is distinct from OLD.brand_id
        or NEW.revision_number is distinct from OLD.revision_number
        or NEW.profile_document is distinct from OLD.profile_document
        or NEW.created_by is distinct from OLD.created_by then
        raise exception using errcode = '23514', message = 'Immutable revision snapshot';
      end if;
    end if;
  end if;
  NEW.updated_at := case when TG_TABLE_NAME = 'brand_revisions' then NEW.created_at else statement_timestamp() end;
  return NEW;
end;
$$;
create trigger workspaces_stamp before insert or update on public.workspaces for each row execute function linde_private.stamp_row();
create trigger memberships_stamp before insert or update on public.memberships for each row execute function linde_private.stamp_row();
create trigger brands_stamp before insert or update on public.brands for each row execute function linde_private.stamp_row();
create trigger brand_revisions_stamp before insert or update on public.brand_revisions for each row execute function linde_private.stamp_row();

-- Deferred: bootstrap inserts workspace and owner membership in either order,
-- but a commit (or SET CONSTRAINTS) can never leave an orphan/mismatched owner.
create function linde_private.check_workspace_owner() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  target uuid;
  workspace public.workspaces;
  owner_count integer;
begin
  if TG_TABLE_NAME = 'workspaces' then target := NEW.id;
  elsif TG_OP = 'DELETE' then target := OLD.workspace_id;
  else target := NEW.workspace_id;
  end if;
  select * into workspace from public.workspaces where id = target;
  if not found then return null; end if;
  select count(*) into owner_count from public.memberships
    where workspace_id = target and role = 'owner' and status = 'active' and user_id = workspace.owner_user_id;
  if owner_count <> 1 then
    raise exception using errcode = '23514', message = 'Workspace must have its active owner membership';
  end if;
  return null;
end;
$$;
create constraint trigger workspaces_owner_consistency after insert or update on public.workspaces
  deferrable initially deferred for each row execute function linde_private.check_workspace_owner();
create constraint trigger memberships_owner_consistency after insert or update or delete on public.memberships
  deferrable initially deferred for each row execute function linde_private.check_workspace_owner();

create function linde_private.is_workspace_member(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.memberships m join public.workspaces w on w.id = m.workspace_id
      join auth.users u on u.id = m.user_id
    where m.workspace_id = target and m.user_id = (select auth.uid())
      and m.status = 'active' and w.status = 'active' and u.email_confirmed_at is not null
  );
$$;

alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.brands enable row level security;
alter table public.brand_revisions enable row level security;
-- Default-deny mutations. RLS SELECT policies deliberately do not grant writes.
create policy workspaces_read on public.workspaces for select to authenticated
  using (linde_private.is_workspace_member(id));
create policy memberships_read on public.memberships for select to authenticated
  using (linde_private.is_workspace_member(workspace_id));
create policy brands_read on public.brands for select to authenticated
  using (linde_private.is_workspace_member(workspace_id));
create policy brand_revisions_read on public.brand_revisions for select to authenticated
  using (linde_private.is_workspace_member(workspace_id));

create function linde_private.require_actor() returns uuid language plpgsql set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not exists (select 1 from auth.users where id = actor and email_confirmed_at is not null) then
    raise exception using errcode = '42501', message = 'Verified authentication required';
  end if;
  return actor;
end;
$$;

-- All writes use the same lock order: workspace, membership, brand. Serializing
-- per workspace is intentionally conservative for this first foundation.
create function linde_private.lock_workspace(target uuid, owner_only boolean) returns uuid language plpgsql set search_path = '' as $$
declare actor uuid := linde_private.require_actor(); member_role text;
begin
  perform 1 from public.workspaces where id = target and status = 'active' for update;
  if not found then raise exception using errcode = '42501', message = 'Resource unavailable'; end if;
  select role into member_role from public.memberships
    where workspace_id = target and user_id = actor and status = 'active' for share;
  if not found or (owner_only and member_role <> 'owner') then
    raise exception using errcode = '42501', message = 'Resource unavailable';
  end if;
  if owner_only and not exists (select 1 from public.workspaces where id = target and owner_user_id = actor) then
    raise exception using errcode = '42501', message = 'Resource unavailable';
  end if;
  return actor;
end;
$$;

-- Minimal, bounded v1 contract. Missing fields are allowed in drafts, not in
-- approval. Assets/import references are deliberately not accepted before FKs exist.
create function linde_private.validate_profile(document jsonb, approving boolean) returns void language plpgsql set search_path = '' as $$
declare section text; field text; value jsonb; item jsonb; limit_length integer;
begin
  if document is null or jsonb_typeof(document) <> 'object' or octet_length(document::text) > 65536
    or document->'schema_version' is distinct from '1'::jsonb
    or exists (select 1 from jsonb_object_keys(document) k where k not in ('schema_version', 'identity', 'visual', 'voice', 'competitors')) then
    raise exception using errcode = '22023', message = 'Invalid profile document';
  end if;
  foreach section in array array['identity','visual','voice'] loop
    if document ? section then
      if jsonb_typeof(document->section) <> 'object' then
        raise exception using errcode = '22023', message = 'Invalid profile section';
      end if;
      for field, value in select * from jsonb_each(document->section) loop
        if not ((section = 'identity' and field in ('name','website_url','description','language'))
          or (section = 'visual' and field in ('colors','font_family'))
          or (section = 'voice' and field in ('tone','audience'))) then
          raise exception using errcode = '22023', message = 'Unsupported profile field';
        end if;
        if field = 'colors' then
          if jsonb_typeof(value) <> 'array' or jsonb_array_length(value) > 12 then
            raise exception using errcode = '22023', message = 'Invalid profile colors';
          end if;
          for item in select * from jsonb_array_elements(value) loop
            if jsonb_typeof(item) <> 'string' or (item #>> '{}') !~ '^#[0-9a-fA-F]{6}$' then
              raise exception using errcode = '22023', message = 'Invalid profile color';
            end if;
          end loop;
        elsif value <> 'null'::jsonb then
          limit_length := case field when 'name' then 160 when 'website_url' then 2048 when 'description' then 8000
            when 'language' then 35 when 'font_family' then 100 when 'tone' then 2000 when 'audience' then 4000 end;
          if jsonb_typeof(value) <> 'string' or char_length(value #>> '{}') > limit_length
            or (field = 'website_url' and (value #>> '{}') !~ '^https://[^[:space:]/?#@]+([/?#][^[:space:]]*)?$') then
            raise exception using errcode = '22023', message = 'Invalid profile field';
          end if;
        end if;
      end loop;
    end if;
  end loop;
  if document ? 'competitors' then
    if jsonb_typeof(document->'competitors') <> 'array' or jsonb_array_length(document->'competitors') > 20 then
      raise exception using errcode = '22023', message = 'Invalid competitors';
    end if;
    for item in select * from jsonb_array_elements(document->'competitors') loop
      if jsonb_typeof(item) <> 'object' or jsonb_typeof(item->'name') is distinct from 'string'
        or char_length(btrim(item->>'name')) not between 1 and 160
        or exists (select 1 from jsonb_object_keys(item) k where k not in ('name','website_url')) then
        raise exception using errcode = '22023', message = 'Invalid competitor';
      end if;
      if item ? 'website_url' and item->'website_url' <> 'null'::jsonb then
        if jsonb_typeof(item->'website_url') <> 'string' or char_length(item->>'website_url') > 2048
          or (item->>'website_url') !~ '^https://[^[:space:]/?#@]+([/?#][^[:space:]]*)?$' then
          raise exception using errcode = '22023', message = 'Invalid competitor URL';
        end if;
      end if;
    end loop;
  end if;
  if approving then
    foreach field in array array['name','description','language','tone','audience'] loop
      section := case when field in ('tone','audience') then 'voice' else 'identity' end;
      value := document #> array[section,field];
      if value is null or jsonb_typeof(value) <> 'string' or char_length(btrim(value #>> '{}')) = 0 then
        raise exception using errcode = '22023', message = 'Required approval fields missing';
      end if;
    end loop;
  end if;
end;
$$;

create function public.bootstrap_workspace(p_name text, p_bootstrap_key text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := linde_private.require_actor(); result public.workspaces; fingerprint text;
begin
  if p_name is null or char_length(btrim(p_name)) not between 1 and 160
    or p_bootstrap_key is null or char_length(btrim(p_bootstrap_key)) not between 1 and 128 then
    raise exception using errcode = '22023', message = 'Invalid workspace input';
  end if;
  -- Lock the authenticated identity to serialize same-user retries, even before
  -- a workspace exists. Neither owner nor actor is accepted as an RPC argument.
  perform 1 from auth.users where id = actor for update;
  fingerprint := encode(sha256(convert_to(jsonb_build_object('name', btrim(p_name))::text, 'UTF8')), 'hex');
  select * into result from public.workspaces where owner_user_id = actor and bootstrap_key = p_bootstrap_key;
  if found then
    if result.request_hash <> fingerprint or result.status <> 'active' then
      raise exception using errcode = '40001', message = 'Bootstrap conflict';
    end if;
    return result.id;
  end if;
  if exists (select 1 from public.workspaces where owner_user_id = actor and status in ('active','deleting')) then
    raise exception using errcode = '40001', message = 'Bootstrap conflict';
  end if;
  insert into public.workspaces(owner_user_id, bootstrap_key, request_hash, name)
    values (actor, p_bootstrap_key, fingerprint, btrim(p_name)) returning * into result;
  insert into public.memberships(workspace_id, user_id, role) values (result.id, actor, 'owner');
  return result.id;
end;
$$;

create function public.create_brand(p_workspace_id uuid, p_name text, p_website_url text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := linde_private.lock_workspace(p_workspace_id, true); brand uuid; snapshot uuid; document jsonb;
begin
  if p_name is null or char_length(btrim(p_name)) not between 1 and 160 then
    raise exception using errcode = '22023', message = 'Invalid brand name';
  end if;
  document := jsonb_build_object('schema_version', 1, 'identity', jsonb_build_object('name', btrim(p_name), 'website_url', p_website_url));
  perform linde_private.validate_profile(document, false);
  insert into public.brands(workspace_id, name, website_url) values (p_workspace_id, btrim(p_name), p_website_url) returning id into brand;
  insert into public.brand_revisions(workspace_id, brand_id, revision_number, profile_document, created_by)
    values (p_workspace_id, brand, 1, document, actor) returning id into snapshot;
  update public.brands set current_revision_id = snapshot where id = brand;
  return brand;
end;
$$;

create function public.save_brand_profile(p_brand_id uuid, p_expected_revision bigint, p_profile_document jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare target uuid; actor uuid; brand public.brands; snapshot uuid; next_number bigint;
begin
  select workspace_id into target from public.brands where id = p_brand_id;
  actor := linde_private.lock_workspace(target, false);
  select * into brand from public.brands where id = p_brand_id for update;
  if brand.archived_at is not null then raise exception using errcode = '42501', message = 'Resource unavailable'; end if;
  if p_expected_revision is null or brand.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Revision conflict';
  end if;
  perform linde_private.validate_profile(p_profile_document, false);
  select coalesce(max(revision_number), 0) + 1 into next_number from public.brand_revisions where brand_id = brand.id;
  insert into public.brand_revisions(workspace_id, brand_id, revision_number, profile_document, created_by)
    values (target, brand.id, next_number, p_profile_document, actor) returning id into snapshot;
  update public.brands set current_revision_id = snapshot, revision = revision + 1,
    name = coalesce(nullif(btrim(p_profile_document #>> '{identity,name}'), ''), name),
    website_url = case when (p_profile_document->'identity') ? 'website_url' then p_profile_document #>> '{identity,website_url}' else website_url end
    where id = brand.id;
  return snapshot;
end;
$$;

create function public.approve_brand_profile(p_brand_id uuid, p_revision_id uuid, p_expected_revision bigint) returns uuid
language plpgsql security definer set search_path = '' as $$
declare target uuid; actor uuid; brand public.brands; snapshot public.brand_revisions;
begin
  select workspace_id into target from public.brands where id = p_brand_id;
  actor := linde_private.lock_workspace(target, true);
  select * into brand from public.brands where id = p_brand_id for update;
  if brand.archived_at is not null then raise exception using errcode = '42501', message = 'Resource unavailable'; end if;
  if p_expected_revision is null or brand.revision <> p_expected_revision or brand.current_revision_id is distinct from p_revision_id then
    raise exception using errcode = '40001', message = 'Revision conflict';
  end if;
  select * into snapshot from public.brand_revisions where id = p_revision_id and workspace_id = target and brand_id = brand.id for update;
  if not found or snapshot.approval_status <> 'draft' then
    raise exception using errcode = '40001', message = 'Revision conflict';
  end if;
  perform linde_private.validate_profile(snapshot.profile_document, true);
  update public.brand_revisions set approval_status = 'approved', approved_by = actor, approved_at = statement_timestamp() where id = snapshot.id;
  update public.brands set current_revision_id = snapshot.id, revision = revision + 1 where id = brand.id;
  return snapshot.id;
end;
$$;

-- Supabase may have default grants for all these roles. Explicitly remove
-- them on OUR objects; never revoke privileges on existing Auth/app objects.
revoke all on public.workspaces, public.memberships, public.brands, public.brand_revisions from public, anon, authenticated, service_role;
grant select on public.workspaces, public.memberships, public.brands, public.brand_revisions to authenticated;
revoke all on all functions in schema linde_private from public, anon, authenticated, service_role;
grant execute on function linde_private.is_workspace_member(uuid) to authenticated;
revoke all on function public.bootstrap_workspace(text,text), public.create_brand(uuid,text,text),
  public.save_brand_profile(uuid,bigint,jsonb), public.approve_brand_profile(uuid,uuid,bigint)
  from public, anon, authenticated, service_role;
grant execute on function public.bootstrap_workspace(text,text), public.create_brand(uuid,text,text),
  public.save_brand_profile(uuid,bigint,jsonb), public.approve_brand_profile(uuid,uuid,bigint) to authenticated;

comment on table public.brand_revisions is 'Append-only profile snapshots; only current draft may transition to approved through RPC. No import/asset IDs until their FK tables exist.';
comment on column public.brands.current_revision_id is 'Latest saved draft or approved revision of THIS brand. Earlier approved revisions remain available in history.';
comment on function public.bootstrap_workspace(text,text) is 'Verified caller only; atomic workspace and matching owner membership; same-key/hash retry returns same UUID.';
commit;
