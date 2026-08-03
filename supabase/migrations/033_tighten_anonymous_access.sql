-- ============================================================
-- GSO PRIMS — Close the anonymous holes the public deployment opened
--
-- The app now answers on a public URL, so "reachable by anon" means reachable
-- by anyone on the internet rather than by anyone on the office network. Three
-- grants that were harmless behind a private deployment are not any more.
--
-- Only anonymous access is narrowed. Every authenticated path the app uses is
-- left exactly as it was.
--
-- Run once in the Supabase SQL Editor, after 032. Safe to re-run.
-- ============================================================

-- ---------- 1. stop anonymous listing of the attachments bucket ----------
-- `attachments_read` granted SELECT on storage.objects to `public`, which is
-- what the storage list API reads. Anyone could therefore enumerate every
-- purchase order, requisition and reservation attachment the office has ever
-- uploaded — not merely open a file whose URL they already held.
--
-- The bucket stays public and downloads are unaffected: a public bucket serves
-- /storage/v1/object/public/... straight from the CDN without consulting RLS,
-- and that is the only path the app uses — src/lib/storage.ts builds its URLs
-- with getPublicUrl(), which is pure client-side string building.
--
-- Staff keep SELECT because the delete path needs to resolve the row, and the
-- public portal only ever inserts, which is a separate policy.

alter policy attachments_read on storage.objects to authenticated;

-- ---------- 2. revoke anonymous writes to the legacy counter table ----------
-- `doc_counters` (prefix, next_no) is the numbering scheme that migration 014
-- replaced with `document_counters` (document_type, year, current_sequence).
-- Nothing in the application references it; the only reader left is the dead
-- `next_doc_number` function below.
--
-- It nevertheless carried an UPDATE policy for `anon` with USING (true) and
-- WITH CHECK (true), so an unauthenticated caller could rewrite its rows. The
-- table is kept — dropping live rows is not this migration's business — but it
-- stops accepting anonymous traffic.

drop policy if exists anon_counters on public.doc_counters;
drop policy if exists anon_counters_read on public.doc_counters;

-- ---------- 3. close the superseded allocator ----------
-- `next_doc_number(text)` is SECURITY DEFINER, writes to doc_counters, and is
-- exposed at /rest/v1/rpc/next_doc_number. The app calls
-- `next_document_number(p_type, p_year)` instead and has since 014.
--
-- Revoking rather than dropping: a dropped function cannot be rolled back
-- without its definition, and a function nobody may execute is inert.

revoke execute on function public.next_doc_number(text) from anon, authenticated, public;

-- ---------- deliberately left alone ----------
--
-- `next_document_number` stays executable by anon. The public portal allocates
-- a PR, RIS or reservation number before the visitor has signed in, so the
-- grant is load-bearing. It does mean an anonymous caller can burn sequence
-- values by calling it in a loop; that is a rate-limiting problem, not a grant
-- problem, and closing the grant would break the portal.
--
-- The `auth_all_*` policies keep USING (true). Every authenticated user of
-- this system is General Services Office staff, and no role model exists to
-- distinguish them. Narrowing these means designing that model first.

-- ---------- report back ----------

select
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'doc_counters'
      and roles::text like '%anon%')                        as anon_policies_sa_doc_counters,
  (select count(*) from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'attachments_read'
      and roles::text like '%public%')                      as public_read_sa_attachments,
  has_function_privilege('anon', 'public.next_doc_number(text)', 'execute')
                                                            as kaya_pa_ng_anon_ang_lumang_rpc,
  has_function_privilege('anon', 'public.next_document_number(text, integer)', 'execute')
                                                            as kaya_pa_ng_anon_ang_bagong_rpc;
