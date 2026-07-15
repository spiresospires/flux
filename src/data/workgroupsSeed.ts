// [MOCK] User directory + workspace workgroups consumed by Automatic
// Distribution (AUTO_DISTRIBUTION_PLAN.md). Served by the MSW handlers; the
// Workgroups Admin page is read-only in this phase, so the seed is the store —
// no localStorage persistence until the manage UI arrives.
// [API] GET /users · GET /workspaces/{wsId}/workgroups [TODO-ENG]
// [PHASE-1]
import type { AdUser, Workgroup } from '../types/workgroup';
import type { ProjectId } from './projects';

/** The signed-in user — the mock server stamps rule edits with this identity. */
export const CURRENT_USER_ID = 'u-ospires';

export const adUsers: AdUser[] = [
  { id: CURRENT_USER_ID, name: 'Oliver Spires', company: 'Idox', role: 'Document Controller', active: true },
  { id: 'u-jsmith', name: 'John Smith', company: 'Clough', role: 'Lead Structural Engineer', active: true },
  { id: 'u-sjohnson', name: 'Sarah Johnson', company: 'Clough', role: 'Civil Engineering Lead', active: true },
  { id: 'u-mchen', name: 'Mike Chen', company: 'Clough', role: 'Electrical Engineer', active: true },
  { id: 'u-lwong', name: 'Lisa Wong', company: 'Iluka Resources', role: 'Project Manager', active: true },
  { id: 'u-dkumar', name: 'David Kumar', company: 'Clough', role: 'Mechanical Engineer', active: true },
  { id: 'u-erodriguez', name: 'Emily Rodriguez', company: 'Twinza', role: 'Process Engineer', active: true },
  { id: 'u-rlee', name: 'Robert Lee', company: 'Clough', role: 'Commissioning Manager', active: true },
  { id: 'u-mgarcia', name: 'Maria Garcia', company: 'Iluka Resources', role: 'HSE Manager', active: true },
  { id: 'u-jwilson', name: 'James Wilson', company: 'Rosetti Marino', role: 'Signalling Engineer', active: true },
  { id: 'u-pbrown', name: 'Patricia Brown', company: 'Idox', role: 'Senior Document Controller', active: true },
  { id: 'u-tanderson', name: 'Thomas Anderson', company: 'Clough', role: 'Quality Manager', active: true },
  { id: 'u-nmiller', name: 'Nancy Miller', company: 'Twinza', role: 'Client Representative', active: true },
  { id: 'u-kwhite', name: 'Kevin White', company: 'Clough', role: 'Marine Engineer', active: false },
  { id: 'u-ltaylor', name: 'Susan Taylor', company: 'Iluka Resources', role: 'Contracts Administrator', active: false },
];

/** Workgroups are workspace-scoped, matching the FusionLive admin model. */
export const workgroupsByProject: Record<ProjectId, Workgroup[]> = {
  hedland: [
    { id: 'wg-hed-civil', name: 'Civil Leads', description: 'Civil and marine-civil discipline leads', memberIds: ['u-sjohnson', 'u-jsmith'] },
    { id: 'wg-hed-structural', name: 'Structural Review Team', description: 'Wharf and topside structural reviewers', memberIds: ['u-jsmith', 'u-kwhite', 'u-dkumar'] },
    { id: 'wg-hed-dc', name: 'DC Team', description: 'Document control', memberIds: [CURRENT_USER_ID, 'u-pbrown'] },
    { id: 'wg-hed-marine', name: 'Marine Engineering', description: 'Dredging, piling and marine structures', memberIds: ['u-kwhite', 'u-sjohnson'] },
    { id: 'wg-hed-client', name: 'Client Reviewers', description: 'Client-side review panel', memberIds: ['u-nmiller', 'u-lwong'] },
    { id: 'wg-hed-comm', name: 'Commissioning Team', description: 'Cold commissioning and load trials', memberIds: ['u-rlee', 'u-mchen'] },
  ],
  'marra-ridge': [
    { id: 'wg-mr-eng', name: 'Engineering Leads', description: 'Discipline lead engineers', memberIds: ['u-jsmith', 'u-mchen', 'u-dkumar'] },
    { id: 'wg-mr-dc', name: 'DC Team', description: 'Document control', memberIds: [CURRENT_USER_ID, 'u-pbrown'] },
    { id: 'wg-mr-hse', name: 'HSE Team', description: 'Safety and environmental reviewers', memberIds: ['u-mgarcia'] },
    { id: 'wg-mr-client', name: 'Client Reviewers', description: 'Owner review panel', memberIds: ['u-lwong', 'u-ltaylor'] },
  ],
  kwinana: [
    { id: 'wg-kw-process', name: 'Process Engineering', description: 'Process and piping reviewers', memberIds: ['u-erodriguez', 'u-dkumar'] },
    { id: 'wg-kw-dc', name: 'DC Team', description: 'Document control', memberIds: [CURRENT_USER_ID, 'u-pbrown'] },
    { id: 'wg-kw-comm', name: 'Systems Completion', description: 'Pre-commissioning and handover', memberIds: ['u-rlee'] },
    { id: 'wg-kw-client', name: 'Client Reviewers', description: 'Owner review panel', memberIds: ['u-nmiller'] },
  ],
  goldfields: [
    { id: 'wg-gf-rail', name: 'Rail Engineering', description: 'Track, structures and signalling leads', memberIds: ['u-jwilson', 'u-jsmith'] },
    { id: 'wg-gf-dc', name: 'DC Team', description: 'Document control', memberIds: [CURRENT_USER_ID] },
    { id: 'wg-gf-quality', name: 'Quality Team', description: 'ITP and NCR reviewers', memberIds: ['u-tanderson'] },
  ],
};
