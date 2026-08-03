import { format } from "date-fns";

import type {
  ProfileStatus,
  Violation,
  ViolationListFilters,
  Violator,
  ViolatorProfile,
} from "@/features/violations/types";

/**
 * Profile aggregation — the module's one piece of real logic.
 *
 * Violations are folded onto the profile they belong to, so the main table
 * shows one row per person no matter how many tickets they hold.
 */

export const formatDate = (iso: string) => format(new Date(iso), "d MMM yyyy");
export const formatDateTime = (iso: string) => format(new Date(iso), "d MMM yyyy · h:mm a");

/**
 * The key two spellings of the same person reduce to, so recording a
 * violation against "NASOL, RICHARD" attaches to the existing "Nasol,
 * Richard" rather than opening a second profile.
 *
 * Mirrors the `name_key` generated column in migration 030 — punctuation
 * dropped, whitespace collapsed, case folded. The database holds the unique
 * index, so it is the authority; this copy exists so the form can look a
 * person up and prefill before saving.
 */
export const normalizeName = (name: string) =>
  name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** The profile matching a typed name, if the office already has one. */
export function matchViolator<T extends { fullName: string }>(
  violators: T[],
  name: string,
): T | null {
  const key = normalizeName(name);
  if (!key) return null;
  return violators.find((v) => normalizeName(v.fullName) === key) ?? null;
}

/** Payment date / OR number as the table shows them when not yet settled. */
export const orDash = (value?: string) => (value?.trim() ? value : "—");

/** A cancelled ticket is void: it owes nothing and counts toward no total. */
const counts = (v: Violation) => v.paymentStatus !== "Cancelled";

/**
 * Derived profile status. Paid once every violation is settled, Pending while
 * any remains unpaid, and No Record only when the profile holds none at all.
 */
export function profileStatus(violations: Violation[]): ProfileStatus {
  if (violations.length === 0) return "No Record";
  const live = violations.filter(counts);
  if (live.length === 0) return "No Record";
  return live.every((v) => v.paymentStatus === "Paid") ? "Paid" : "Pending";
}

/**
 * Folds violations onto their parent profiles, oldest violation first — the
 * order the printed history sheet and the profile drawer both read in, so a
 * person's record runs forward in time rather than backward.
 */
export function buildProfiles(
  violators: Violator[],
  violations: Violation[],
): ViolatorProfile[] {
  const byViolator = new Map<string, Violation[]>();
  for (const v of violations) {
    const list = byViolator.get(v.violatorId);
    if (list) list.push(v);
    else byViolator.set(v.violatorId, [v]);
  }

  return violators.map((violator) => {
    const own = (byViolator.get(violator.id) ?? [])
      .slice()
      .sort((a, b) => a.dateIssued.localeCompare(b.dateIssued));
    const live = own.filter(counts);

    const totalAmount = live.reduce((sum, v) => sum + v.amount, 0);
    const totalPaid = live.reduce((sum, v) => sum + v.amountPaid, 0);

    return {
      violator,
      violations: own,
      totalViolations: own.length,
      paidCount: own.filter((v) => v.paymentStatus === "Paid").length,
      pendingCount: own.filter((v) => v.paymentStatus === "Pending").length,
      cancelledCount: own.filter((v) => v.paymentStatus === "Cancelled").length,
      totalAmount,
      totalPaid,
      outstandingBalance: totalAmount - totalPaid,
      status: profileStatus(own),
    };
  });
}

/** yyyy-MM-dd, for comparing against a date column. */
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Narrows the violation set by the violation-level filters. The profile list
 * is then rebuilt from what survives, so a filter genuinely re-scopes the
 * counts and totals shown against each person.
 */
export function filterViolations(
  violations: Violation[],
  filters: ViolationListFilters,
): Violation[] {
  return violations.filter((v) => {
    if (filters.violationType && v.violationType !== filters.violationType) return false;
    if (filters.dateFrom && v.dateIssued < dateKey(filters.dateFrom)) return false;
    if (filters.dateTo && v.dateIssued > dateKey(filters.dateTo)) return false;
    return true;
  });
}

/**
 * Search matches a violator by their own name, by any of their violation
 * numbers, or by any receipt/OR number recorded against them — which is why
 * profiles are assembled client-side rather than queried per table.
 */
function matchesSearch(profile: ViolatorProfile, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (profile.violator.fullName.toLowerCase().includes(q)) return true;
  return profile.violations.some(
    (v) =>
      v.violationNo.toLowerCase().includes(q) ||
      (v.orNumber ?? "").toLowerCase().includes(q) ||
      v.violationType.toLowerCase().includes(q),
  );
}

/**
 * The profile list as the main table renders it: violation-level filters
 * applied, profiles rebuilt from the survivors, then searched and status-
 * filtered. A profile whose every violation was filtered out drops away,
 * unless no violation-level filter is active — an untouched list still shows
 * people who simply have no record yet.
 */
export function buildProfileList(
  violators: Violator[],
  violations: Violation[],
  filters: ViolationListFilters = {},
): ViolatorProfile[] {
  const narrowing = !!(filters.violationType || filters.dateFrom || filters.dateTo);
  const scoped = narrowing ? filterViolations(violations, filters) : violations;

  return buildProfiles(violators, scoped)
    .filter((p) => (narrowing ? p.totalViolations > 0 : true))
    .filter((p) => matchesSearch(p, filters.search ?? ""))
    .filter((p) => (filters.status ? p.status === filters.status : true))
    .sort((a, b) => a.violator.fullName.localeCompare(b.violator.fullName));
}

/** Register-wide figures for the summary cards. */
export function summarize(profiles: ViolatorProfile[]) {
  return {
    totalViolators: profiles.length,
    totalViolations: profiles.reduce((sum, p) => sum + p.totalViolations, 0),
    pendingPayments: profiles.reduce((sum, p) => sum + p.pendingCount, 0),
    totalCollected: profiles.reduce((sum, p) => sum + p.totalPaid, 0),
  };
}
