-- ============================================================
-- GSO PRIMS — NAP Form No. 3: the certifier's position
--
-- An accomplished copy of the form shows the officer who certifies the
-- disposal signing over BOTH a name and a position:
--
--     MR. VICTORINO MAPA MANALO, C.E.S.E.
--     Deputy Executive Director
--     ────────────────────────────────────
--     Name and Signature of Agency Head
--     or Duly Authorized Representative
--
-- Migration 042 stored only the name, so the printed form lost the line
-- that says on whose authority the records may be destroyed. That is the
-- part of the certification a reader checks.
--
-- Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================

alter table public.disposal_requests
  add column if not exists certified_by_position text;
