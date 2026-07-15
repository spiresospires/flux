// Workgroups — the FusionLive admin concept, used by Automatic Distribution for
// the first time in FLUX (AUTO_DISTRIBUTION_PLAN.md §2). Workspace-scoped, like
// the rule set. AD 1 ships seed data + a read-only Admin page; full membership
// management is a later Admin phase.
// [API] Workgroups are not in the G01–G30 set; suggested home alongside the
// workspace-membership endpoints. [TODO-ENG]
// [PHASE-1]

/** A directory user that rules and workgroups can reference. */
export interface AdUser {
  id: string;
  name: string;
  company: string;
  role: string;
  /** Deactivated users are auto-skipped at distribution time with an alert to
   *  the rule managers (plan §1 — never a hard failure). */
  active: boolean;
}

export interface Workgroup {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
}
