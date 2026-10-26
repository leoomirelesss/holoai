\set ON_ERROR_STOP on
begin;
create temporary table test_context(key text primary key, value uuid);
grant select on test_context to authenticated, anon;
create function pg_temp.ctx(key_name text) returns uuid language sql as $$ select value from pg_temp.test_context where key = key_name; $$;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'FAIL: %', label; end if;
  raise notice 'PASS: %', label;
end;
$$;
create function pg_temp.expect_error(statement text, expected_state text, label text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if SQLSTATE = expected_state then raise notice 'PASS: %', label; return; end if;
    raise exception 'FAIL: % (expected %, received %)', label, expected_state, SQLSTATE;
  end;
  raise exception 'FAIL: % (statement unexpectedly succeeded)', label;
end;
$$;

select pg_temp.assert_true((select count(*) = 4 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r'), 'exactly four business tables');
select pg_temp.assert_true((select bool_and(relrowsecurity) from pg_class where oid in ('public.workspaces'::regclass,'public.memberships'::regclass,'public.brands'::regclass,'public.brand_revisions'::regclass)), 'all four tables have RLS');
select pg_temp.assert_true((select count(*) = 4 and bool_and(polcmd = 'r') from pg_policy where polrelid in ('public.workspaces'::regclass,'public.memberships'::regclass,'public.brands'::regclass,'public.brand_revisions'::regclass)), 'only SELECT policies: writes default deny');
select pg_temp.assert_true((select bool_and(prosecdef and proconfig @> array['search_path=""']) from pg_proc where oid in ('public.bootstrap_workspace(text,text)'::regprocedure,'public.create_brand(uuid,text,text)'::regprocedure,'public.save_brand_profile(uuid,bigint,jsonb)'::regprocedure,'public.approve_brand_profile(uuid,uuid,bigint)'::regprocedure)), 'RPC security definer and fixed empty search_path');
select pg_temp.assert_true(not has_function_privilege('authenticated','linde_private.lock_workspace(uuid,boolean)','execute') and not has_function_privilege('anon','linde_private.is_workspace_member(uuid)','execute'), 'internal functions are not callable by session roles');
select pg_temp.assert_true(not has_schema_privilege('anon','linde_private','usage'), 'anon cannot resolve internal schema');

-- Fixtures use only two synthetic identities in the local database.
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
select public.bootstrap_workspace('Workspace A', 'bootstrap-a') as workspace_a \gset
reset role;
insert into test_context values ('workspace_a', :'workspace_a');
set local role authenticated;
select pg_temp.assert_true(public.bootstrap_workspace('Workspace A', 'bootstrap-a') = pg_temp.ctx('workspace_a'), 'same key and payload is idempotent');
select pg_temp.expect_error($q$select public.bootstrap_workspace('Changed', 'bootstrap-a')$q$, '40001', 'same key different payload conflicts');
select pg_temp.expect_error($q$select public.bootstrap_workspace('Second', 'bootstrap-a2')$q$, '40001', 'one live owned workspace per V1 user');
select pg_temp.expect_error($q$select public.bootstrap_workspace('', 'invalid')$q$, '22023', 'invalid bootstrap input rejected');
select pg_temp.assert_true((select count(*) = 1 from public.workspaces), 'owner sees own workspace');
select pg_temp.assert_true((select count(*) = 1 and bool_and(role = 'owner' and status = 'active') from public.memberships), 'bootstrap creates matching active owner membership');
select public.create_brand(pg_temp.ctx('workspace_a'), 'Brand A', 'https://example.com') as brand_a \gset
select public.create_brand(pg_temp.ctx('workspace_a'), 'Other A') as brand_a2 \gset
reset role;
insert into test_context values ('brand_a', :'brand_a'), ('brand_a2', :'brand_a2');
set local role authenticated;
select pg_temp.assert_true((select count(*) = 2 from public.brand_revisions), 'brand creation atomically creates initial draft');
select pg_temp.assert_true((select approval_status = 'draft' and revision_number = 1 and created_by = auth.uid() from public.brand_revisions where brand_id = pg_temp.ctx('brand_a')), 'initial revision is attributed to session actor');
select pg_temp.assert_true((select bool_and(created_at = updated_at) from public.brand_revisions), 'immutable revision timestamps match');
select pg_temp.assert_true((select bool_and(created_at is not null and id is not null) from public.brands), 'UUID and timestamps generated without caller input');
select pg_temp.expect_error($q$select public.create_brand(pg_temp.ctx('workspace_a'), 'Bad', 'javascript:alert(1)')$q$, '22023', 'unsafe URL scheme rejected');
select pg_temp.expect_error($q$select public.create_brand(pg_temp.ctx('workspace_a'), 'Bad', 'https://secret@example.com')$q$, '22023', 'URL credentials rejected');
select pg_temp.assert_true((select count(*) = 2 from public.brands), 'invalid create leaves no partial brand');
select pg_temp.expect_error($q$select public.approve_brand_profile(id,current_revision_id,revision) from public.brands where id=pg_temp.ctx('brand_a')$q$, '22023', 'incomplete draft cannot be approved');
select pg_temp.expect_error($q$select public.save_brand_profile(pg_temp.ctx('brand_a'),1,'{"schema_version":1,"owner_user_id":"forged"}')$q$, '22023', 'profile rejects actor and unexpected fields');
select pg_temp.expect_error($q$select public.save_brand_profile(pg_temp.ctx('brand_a'),1,'{"schema_version":1,"visual":{"colors":["red"]}}')$q$, '22023', 'invalid colors rejected');
select pg_temp.expect_error($q$select public.save_brand_profile(pg_temp.ctx('brand_a'),1,'{"schema_version":2}')$q$, '22023', 'unsupported profile version rejected');
select pg_temp.expect_error($q$select public.save_brand_profile(pg_temp.ctx('brand_a'),1,jsonb_build_object('schema_version',1,'identity',jsonb_build_object('description',repeat('x',66000))))$q$, '22023', 'oversized profile rejected');
select public.save_brand_profile(pg_temp.ctx('brand_a'), 1, '{"schema_version":1,"identity":{"name":"Brand A edited","description":"Description","language":"es"},"voice":{"tone":"Clear","audience":"Local businesses"},"visual":{"colors":["#123456"],"font_family":"Inter"},"competitors":[{"name":"Example","website_url":"https://example.org"}]}') as revision_a \gset
reset role;
insert into test_context values ('revision_a', :'revision_a');
set local role authenticated;
select pg_temp.assert_true((select revision = 2 and current_revision_id = pg_temp.ctx('revision_a') and name = 'Brand A edited' from public.brands where id = pg_temp.ctx('brand_a')), 'save advances version and current pointer together');
select pg_temp.expect_error($q$select public.save_brand_profile(pg_temp.ctx('brand_a'),1,'{"schema_version":1}')$q$, '40001', 'stale write rejected without overwrite');
select pg_temp.assert_true((select count(*) = 2 from public.brand_revisions where brand_id = pg_temp.ctx('brand_a')), 'stale write creates no revision');
select public.approve_brand_profile(pg_temp.ctx('brand_a'), pg_temp.ctx('revision_a'), 2);
select pg_temp.assert_true((select approval_status = 'approved' and approved_by = auth.uid() and approved_at is not null and created_at = updated_at from public.brand_revisions where id = pg_temp.ctx('revision_a')), 'approval stamps verified owner and server time');
select pg_temp.assert_true((select revision = 3 from public.brands where id = pg_temp.ctx('brand_a')), 'approval advances optimistic lock');
select pg_temp.expect_error($q$select public.approve_brand_profile(pg_temp.ctx('brand_a'),pg_temp.ctx('revision_a'),3)$q$, '40001', 'approved revision cannot be re-approved');
select public.save_brand_profile(pg_temp.ctx('brand_a'), 3, '{"schema_version":1,"identity":{"name":"Next draft"}}');
select pg_temp.assert_true((select count(*) = 3 from public.brand_revisions where brand_id = pg_temp.ctx('brand_a')), 'editing approved DNA appends a new snapshot');
select pg_temp.assert_true((select approval_status = 'approved' and profile_document #>> '{identity,name}' = 'Brand A edited' from public.brand_revisions where id = pg_temp.ctx('revision_a')), 'previous approved DNA preserved exactly');
select pg_temp.assert_true((select r.approval_status = 'draft' from public.brands b join public.brand_revisions r on r.id = b.current_revision_id where b.id = pg_temp.ctx('brand_a')), 'new version is draft, not implicitly approved');
select pg_temp.expect_error($q$select public.approve_brand_profile(pg_temp.ctx('brand_a'),pg_temp.ctx('revision_a'),4)$q$, '40001', 'historical revision cannot replace current draft');
reset role;

select set_config('request.jwt.claims',jsonb_build_object('sub','22222222-2222-4222-8222-222222222222','role','authenticated','user_metadata',jsonb_build_object('role','owner','workspace_id',pg_temp.ctx('workspace_a')))::text,true);
create function pg_temp.reject_membership() returns trigger language plpgsql as $$ begin raise exception using errcode='23514', message='Injected local membership failure'; end; $$;
create trigger test_membership_failure before insert on public.memberships for each row execute function pg_temp.reject_membership();
set local role authenticated;
select pg_temp.expect_error($q$select public.bootstrap_workspace('Workspace B','bootstrap-b')$q$, '23514', 'membership failure rolls back workspace creation');
select pg_temp.assert_true((select count(*)=0 from public.workspaces), 'failed bootstrap leaves no workspace');
select pg_temp.assert_true((select count(*)=0 from public.memberships), 'failed bootstrap leaves no membership');
reset role;
drop trigger test_membership_failure on public.memberships;
set local role authenticated;
select public.bootstrap_workspace('Workspace B', 'bootstrap-b') as workspace_b \gset
reset role;
insert into test_context values ('workspace_b', :'workspace_b');
set local role authenticated;
select public.create_brand(pg_temp.ctx('workspace_b'), 'Brand B') as brand_b \gset
reset role;
insert into test_context values ('brand_b', :'brand_b');
set local role authenticated;
select pg_temp.assert_true((select count(*) = 1 from public.workspaces), 'B cannot enumerate A workspace');
select pg_temp.assert_true((select count(*) = 1 from public.memberships), 'B cannot enumerate A membership');
select pg_temp.assert_true((select count(*) = 1 from public.brands), 'B cannot enumerate A brands');
select pg_temp.assert_true((select count(*) = 1 from public.brand_revisions), 'B cannot enumerate A profile history');
select pg_temp.expect_error($q$select public.create_brand(pg_temp.ctx('workspace_a'),'Intruder')$q$, '42501', 'B cannot create brand in A workspace');
select pg_temp.expect_error($q$select public.save_brand_profile(pg_temp.ctx('brand_a'),4,'{"schema_version":1}')$q$, '42501', 'B cannot edit A profile even with valid version');
select pg_temp.expect_error($q$select public.approve_brand_profile(pg_temp.ctx('brand_a'),pg_temp.ctx('revision_a'),4)$q$, '42501', 'B cannot approve A profile');
select pg_temp.expect_error($q$select public.save_brand_profile('99999999-9999-4999-8999-999999999999',1,'{"schema_version":1}')$q$, '42501', 'unknown UUID gets same unavailable error');
select pg_temp.expect_error($q$update public.memberships set role='owner' where workspace_id=pg_temp.ctx('workspace_a')$q$, '42501', 'direct role escalation forbidden');
select pg_temp.expect_error($q$update public.workspaces set owner_user_id=auth.uid() where id=pg_temp.ctx('workspace_a')$q$, '42501', 'direct workspace takeover forbidden');
select pg_temp.expect_error($q$update public.brand_revisions set profile_document='{}' where brand_id=pg_temp.ctx('brand_a')$q$, '42501', 'direct modification of foreign profiles forbidden');
select pg_temp.expect_error($q$select * from auth.users$q$, '42501', 'no access to other Auth user records');
select pg_temp.assert_true(not linde_private.is_workspace_member(pg_temp.ctx('workspace_a')), 'editable metadata grants no membership');
reset role;

-- DML grants are intentionally absent; prove RLS remains default-deny EVEN IF
-- a later migration accidentally adds them. These grants are rolled back.
grant insert,update,delete on public.workspaces,public.memberships,public.brands,public.brand_revisions to authenticated;
set local role authenticated;
select pg_temp.expect_error($q$insert into public.brands(workspace_id,name) values(pg_temp.ctx('workspace_a'),'Cross-tenant')$q$, '42501', 'RLS rejects cross-tenant insert even with table grant');
select pg_temp.expect_error($q$insert into public.brands(workspace_id,name) values(pg_temp.ctx('workspace_b'),'Own direct insert')$q$, '42501', 'RLS rejects own direct insert outside RPC');
with changed as (update public.brands set name='Hacked' where id=pg_temp.ctx('brand_a') returning id) select pg_temp.assert_true(count(*)=0, 'RLS cross-tenant UPDATE touches no rows') from changed;
with removed as (delete from public.brand_revisions where brand_id=pg_temp.ctx('brand_a') returning id) select pg_temp.assert_true(count(*)=0, 'RLS cross-tenant DELETE touches no rows') from removed;
with changed as (update public.brands set name='Bypass' where id=pg_temp.ctx('brand_b') returning id) select pg_temp.assert_true(count(*)=0, 'RLS own UPDATE denied outside RPC') from changed;
reset role;
revoke insert,update,delete on public.workspaces,public.memberships,public.brands,public.brand_revisions from authenticated;

-- Native FK checks execute as migration owner, so RLS cannot mask a bad FK.
select pg_temp.expect_error($q$insert into public.brands(workspace_id,name) values('99999999-9999-4999-8999-999999999999','Orphan')$q$, '23503', 'brand needs real workspace');
select pg_temp.expect_error($q$insert into public.brand_revisions(workspace_id,brand_id,revision_number,profile_document,created_by) values(pg_temp.ctx('workspace_b'),pg_temp.ctx('brand_a'),99,'{}','22222222-2222-4222-8222-222222222222')$q$, '23503', 'composite revision FK blocks mixed workspace and brand');
select pg_temp.expect_error($q$update public.brands set current_revision_id=pg_temp.ctx('revision_a') where id=pg_temp.ctx('brand_b')$q$, '23503', 'current pointer cannot reference other tenant');
select pg_temp.expect_error($q$update public.brands set current_revision_id=pg_temp.ctx('revision_a') where id=pg_temp.ctx('brand_a2')$q$, '23503', 'current pointer cannot reference different brand in same tenant');
select pg_temp.expect_error($q$update public.brands set workspace_id=pg_temp.ctx('workspace_b') where id=pg_temp.ctx('brand_a')$q$, '23514', 'brand cannot change tenant');
select pg_temp.expect_error($q$update public.brand_revisions set profile_document='{}' where id=pg_temp.ctx('revision_a')$q$, '23514', 'approved content immutable even for accidental privileged update');
select pg_temp.expect_error($q$delete from public.brand_revisions where id=(select current_revision_id from public.brands where id=pg_temp.ctx('brand_a'))$q$, '23503', 'pointed revision cannot be deleted');
select pg_temp.expect_error($q$delete from auth.users where id='11111111-1111-4111-8111-111111111111'$q$, '23503', 'identity deletion RESTRICT protects owned data');
select pg_temp.expect_error($q$insert into public.brand_revisions(workspace_id,brand_id,revision_number,profile_document,created_by) values(pg_temp.ctx('workspace_a'),pg_temp.ctx('brand_a'),1,'{}','11111111-1111-4111-8111-111111111111')$q$, '23505', 'revision numbers unique per brand');
select pg_temp.expect_error($q$insert into public.brand_revisions(workspace_id,brand_id,revision_number,profile_document,created_by,approval_status) values(pg_temp.ctx('workspace_a'),pg_temp.ctx('brand_a'),99,'{}','11111111-1111-4111-8111-111111111111','approved')$q$, '23514', 'approved status requires actor and timestamp');

-- Force deferred owner validation inside a caught subtransaction.
create function pg_temp.break_owner() returns void language plpgsql as $$
begin
  update public.memberships set status='revoked' where workspace_id=pg_temp.ctx('workspace_a') and role='owner';
  set constraints all immediate;
end;
$$;
select pg_temp.expect_error('select pg_temp.break_owner()', '23514', 'commit cannot leave workspace without active owner');
set constraints all immediate;
set constraints all deferred;

-- A joining B workspace is only a privileged fixture, not an invitation API.
insert into public.memberships(workspace_id,user_id,role) values(pg_temp.ctx('workspace_b'),'11111111-1111-4111-8111-111111111111','member');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
select pg_temp.assert_true((select count(*) = 2 from public.workspaces), 'active membership may access explicitly shared workspace');
select pg_temp.expect_error($q$select public.create_brand(pg_temp.ctx('workspace_b'),'Forbidden')$q$, '42501', 'member cannot create brands: owner-only');
select public.save_brand_profile(pg_temp.ctx('brand_b'),1,'{"schema_version":1,"identity":{"name":"Member edit","description":"D","language":"es"},"voice":{"tone":"T","audience":"A"}}');
select pg_temp.assert_true((select revision=2 from public.brands where id=pg_temp.ctx('brand_b')), 'active member can save draft as Architect permits');
select pg_temp.expect_error($q$select public.approve_brand_profile(id,current_revision_id,revision) from public.brands where id=pg_temp.ctx('brand_b')$q$, '42501', 'member cannot approve: owner-only');
reset role;
update public.memberships set status='revoked' where workspace_id=pg_temp.ctx('workspace_b') and user_id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.brands where id=pg_temp.ctx('brand_b')), 'revoked membership loses reads immediately');
select pg_temp.expect_error($q$select public.save_brand_profile(pg_temp.ctx('brand_b'),2,'{"schema_version":1}')$q$, '42501', 'revoked member loses writes with same JWT');
reset role;
update public.brands set archived_at=statement_timestamp() where id=pg_temp.ctx('brand_a');
set local role authenticated;
select pg_temp.expect_error($q$select public.save_brand_profile(pg_temp.ctx('brand_a'),4,'{"schema_version":1}')$q$, '42501', 'archived brand rejects new writes');
reset role;
update public.brands set archived_at=null where id=pg_temp.ctx('brand_a');
update public.workspaces set status='deleting' where id=pg_temp.ctx('workspace_a');
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.brands where id=pg_temp.ctx('brand_a')), 'inactive tenant hides brand data');
select pg_temp.expect_error($q$select public.create_brand(pg_temp.ctx('workspace_a'),'Forbidden')$q$, '42501', 'deleting workspace rejects mutation');
reset role;
update public.workspaces set status='active' where id=pg_temp.ctx('workspace_a');
update auth.users set email_confirmed_at=null where id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.workspaces), 'unconfirmed identity cannot read tenants');
select pg_temp.expect_error($q$select public.bootstrap_workspace('No','unconfirmed')$q$, '42501', 'unconfirmed identity cannot bootstrap');
reset role;
update auth.users set email_confirmed_at=statement_timestamp() where id='11111111-1111-4111-8111-111111111111';

select set_config('request.jwt.claims','{}',true);
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.brands), 'authenticated role without sub still cannot read');
select pg_temp.expect_error($q$select public.bootstrap_workspace('No','missing-sub')$q$, '42501', 'missing auth.uid cannot invoke privileged mutation');
reset role;
set local role anon;
select pg_temp.expect_error('select * from public.workspaces', '42501', 'anon cannot read workspaces');
select pg_temp.expect_error('select * from public.memberships', '42501', 'anon cannot read memberships');
select pg_temp.expect_error('select * from public.brands', '42501', 'anon cannot read brands');
select pg_temp.expect_error('select * from public.brand_revisions', '42501', 'anon cannot read DNA history');
select pg_temp.expect_error($q$select public.bootstrap_workspace('No','anon')$q$, '42501', 'anon cannot bootstrap');
select pg_temp.expect_error($q$select public.create_brand(pg_temp.ctx('workspace_a'),'No')$q$, '42501', 'anon cannot call brand creation');
select pg_temp.expect_error($q$select public.save_brand_profile(pg_temp.ctx('brand_a'),4,'{"schema_version":1}')$q$, '42501', 'anon cannot call profile save');
select pg_temp.expect_error($q$select public.approve_brand_profile(pg_temp.ctx('brand_a'),pg_temp.ctx('revision_a'),4)$q$, '42501', 'anon cannot call approval');
reset role;
-- Inspect all privileges, not only the paths exercised above.
do $$
declare target text; role_name text; operation text;
begin
  foreach target in array array['workspaces','memberships','brands','brand_revisions'] loop
    perform pg_temp.assert_true(has_table_privilege('authenticated','public.'||target,'SELECT'), 'authenticated SELECT grant: '||target);
    foreach role_name in array array['anon','authenticated','service_role'] loop
      foreach operation in array array['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
        perform pg_temp.assert_true(not has_table_privilege(role_name,'public.'||target,operation), 'no '||operation||' for '||role_name||': '||target);
      end loop;
    end loop;
  end loop;
end;
$$;
rollback;
