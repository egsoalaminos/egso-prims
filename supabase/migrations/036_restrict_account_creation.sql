-- ============================================================
-- GSO PRIMS — Only the office may hold an account
--
-- Public sign-up is enabled on this project (`disable_signup: false`, which
-- anyone can read at /auth/v1/settings). On a private deployment that was
-- nearly academic. It is not any more:
--
--   1. the app answers on a public URL
--   2. anyone may register, and confirm from their own inbox
--   3. every `auth_all_*` policy reads USING (true) FOR ALL TO authenticated,
--      across twenty-five tables
--
-- Those three together mean a stranger could sign up and hold full read,
-- write and delete over the whole register — purchase orders, suppliers,
-- inventory, violations, the audit trail. Not a gap in one table: the entire
-- system, because "authenticated" was only ever meant to say "someone from
-- the General Services Office".
--
-- THE PRIMARY FIX IS NOT IN THIS FILE. Turn sign-ups off in the dashboard:
--   Authentication → Sign In / Providers → Email → "Allow new users to sign up"
-- This migration is the second lock, so the door stays shut if that setting is
-- ever switched back on.
--
-- The application never calls signUp — it signs in with a password, and
-- accounts are issued by the office out of band. Nothing in the app changes:
-- signing in updates auth.users rather than inserting into it, so existing
-- accounts and the login screen behave exactly as before.
--
-- Run once in the Supabase SQL Editor, after 035. Safe to re-run.
-- ============================================================

-- ---------- the rule ----------
-- The office's own domain, and nothing else. Every account on this project
-- today is an @alaminos.gov.ph address.
--
-- TO ALLOW ANOTHER DOMAIN, add it to the array below and re-run this file.
-- It is deliberately not held in `system_configuration`: that table is
-- writable by any authenticated user, so a foothold there would be enough to
-- widen the very rule meant to prevent one.
--
-- The function lives in `public` rather than `auth` because the migration
-- role has USAGE but not CREATE on the auth schema. Being SECURITY DEFINER in
-- an exposed schema would normally be worth a second look, but a function
-- returning `trigger` cannot be reached over PostgREST — it answers PGRST202
-- — and EXECUTE is revoked below regardless.

create or replace function public.enforce_office_domain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed text[] := array['alaminos.gov.ph'];
  v_domain text := lower(split_part(coalesce(new.email, ''), '@', 2));
begin
  if v_domain = '' or not (v_domain = any (v_allowed)) then
    raise exception
      'Accounts on this system are issued by the General Services Office. % is not an office address.',
      coalesce(new.email, '(no email)')
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_office_domain() from anon, authenticated, public;

drop trigger if exists enforce_office_domain on auth.users;
create trigger enforce_office_domain
  before insert on auth.users
  for each row execute function public.enforce_office_domain();

-- ---------- what this does not do ----------
--
-- It stops a stranger holding an account. It does not narrow what an account
-- may then reach: the `auth_all_*` policies still grant every signed-in user
-- the whole register, because this system has no roles to tell a clerk from a
-- department head. That model is worth building, and it is a larger piece of
-- work than a migration.
--
-- Nor does it touch anyone already registered. There is one account and it is
-- an office address; if that ever stops being true, this trigger will not
-- notice, because it only reads inserts.

-- ---------- report back ----------

select
  (select count(*) from auth.users)                                  as mga_account,
  (select string_agg(distinct split_part(email, '@', 2), ', ')
     from auth.users)                                                as mga_domain,
  (select count(*) from pg_trigger
     where tgname = 'enforce_office_domain' and not tgisinternal)     as guard_naka_install;
