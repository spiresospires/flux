// [MOCK] Automatic Distribution seed — rule sets + workspace settings
// (AUTO_DISTRIBUTION_PLAN.md). Consumed by the MSW handlers, which persist all
// edits to localStorage under flux.ad.<wsId>; this seed is only the first-run
// state. Every condition value below exists in the mockDocuments data so the
// Tester (AD 3) fires against real documents.
// [API] /workspaces/{wsId}/distribution/* [TODO-ENG]
// [PHASE-1]
import type { AdRule, AdRuleSet, AdSettings } from '../types/distribution';
import type { ProjectId } from './projects';
import { CURRENT_USER_ID } from './workgroupsSeed';

/** Editable per workspace via the Settings tab (AD 2) — these are the defaults. */
export const defaultAdSettings: AdSettings = {
  // Dedupe: a recipient owed two different actions gets the earliest in this list.
  actionPrecedence: ['formal-review', 'formal-approval', 'transmittal', 'technical-query', 'rfi', 'message'],
  reasons: {
    'formal-review': [
      { id: 'lead', label: 'Lead Reviewer' },
      { id: 'consolidator', label: 'Consolidator' },
      { id: 'commenter', label: 'Commenter' },
      { id: 'info', label: 'For Information' },
    ],
    'formal-approval': [
      { id: 'assigned', label: 'Assigned To' },
      { id: 'commenter', label: 'Commenter' },
      { id: 'info', label: 'For Information' },
    ],
    message: [
      { id: 'to', label: 'To' },
      { id: 'cc', label: 'Cc' },
    ],
    transmittal: [{ id: 'to', label: 'To' }],
    'technical-query': [
      { id: 'assigned', label: 'Assigned To' },
      { id: 'info', label: 'For Information' },
    ],
    rfi: [
      { id: 'assigned', label: 'Assigned To' },
      { id: 'info', label: 'For Information' },
    ],
  },
  notifyUserIds: [CURRENT_USER_ID, 'u-pbrown'],
};

const stamp = { updatedAt: '2026-06-28T09:00:00Z', updatedBy: CURRENT_USER_ID };

const hedlandRules: AdRule[] = [
  {
    id: 'r-hed-civil-review',
    name: 'Civil drawings for formal review',
    description: 'New civil discipline drawings go to the civil leads for review, DC copied.',
    triggers: [{ kind: 'upload' }],
    conditions: [
      { field: 'discipline', operator: 'is', values: ['Civil'] },
      { field: 'documentType', operator: 'is', values: ['Drawing'] },
      { field: 'status', operator: 'is', values: ['Draft'] },
    ],
    assignments: [
      { recipient: { kind: 'workgroup', workgroupId: 'wg-hed-civil' }, action: 'formal-review', reasonId: 'lead' },
      { recipient: { kind: 'user', userId: 'u-pbrown' }, action: 'formal-review', reasonId: 'consolidator' },
      { recipient: { kind: 'workgroup', workgroupId: 'wg-hed-dc' }, action: 'message', reasonId: 'cc' },
    ],
    priority: 20,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-hed-structural-review',
    name: 'Structural drawings for formal review',
    triggers: [{ kind: 'upload' }],
    conditions: [
      { field: 'discipline', operator: 'is', values: ['Structural'] },
      { field: 'documentType', operator: 'is', values: ['Drawing'] },
    ],
    assignments: [
      { recipient: { kind: 'workgroup', workgroupId: 'wg-hed-structural' }, action: 'formal-review', reasonId: 'lead' },
      { recipient: { kind: 'workgroup', workgroupId: 'wg-hed-dc' }, action: 'message', reasonId: 'cc' },
    ],
    priority: 20,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-hed-electrical-review',
    name: 'Electrical drawings for formal review',
    triggers: [{ kind: 'upload' }],
    conditions: [
      { field: 'discipline', operator: 'is', values: ['Electrical'] },
      { field: 'documentType', operator: 'in', values: ['Drawing', 'Specification'] },
    ],
    assignments: [
      { recipient: { kind: 'user', userId: 'u-mchen' }, action: 'formal-review', reasonId: 'lead' },
    ],
    priority: 30,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-hed-marine-specs',
    name: 'Marine specifications for approval',
    description: 'Marine-tagged specifications need formal approval by the marine engineering group.',
    triggers: [{ kind: 'upload' }],
    conditions: [
      { field: 'documentType', operator: 'is', values: ['Specification'] },
      { field: 'tags', operator: 'contains', values: ['marine'] },
    ],
    assignments: [
      { recipient: { kind: 'workgroup', workgroupId: 'wg-hed-marine' }, action: 'formal-approval', reasonId: 'assigned' },
      { recipient: { kind: 'user', userId: 'u-lwong' }, action: 'formal-approval', reasonId: 'info' },
    ],
    priority: 25,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-hed-approved-transmittal',
    name: 'Approved documents — transmittal to client',
    description: 'Everything reaching Approved is transmitted to the client review panel.',
    triggers: [{ kind: 'status-change', toStatus: 'Approved' }],
    conditions: [{ field: 'status', operator: 'is', values: ['Approved'] }],
    assignments: [
      { recipient: { kind: 'workgroup', workgroupId: 'wg-hed-client' }, action: 'transmittal', reasonId: 'to' },
      { recipient: { kind: 'workgroup', workgroupId: 'wg-hed-dc' }, action: 'message', reasonId: 'cc' },
    ],
    priority: 10,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-hed-safety-notice',
    name: 'Safety procedures notification',
    triggers: [{ kind: 'upload' }, { kind: 'status-change', toStatus: 'Approved' }],
    conditions: [{ field: 'tags', operator: 'contains', values: ['safety'] }],
    assignments: [
      { recipient: { kind: 'user', userId: 'u-mgarcia' }, action: 'message', reasonId: 'to' },
      { recipient: { kind: 'workgroup', workgroupId: 'wg-hed-dc' }, action: 'message', reasonId: 'cc' },
    ],
    priority: 40,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-hed-commissioning',
    name: 'Commissioning documents to commissioning team',
    triggers: [{ kind: 'upload' }],
    conditions: [{ field: 'tags', operator: 'contains', values: ['commissioning'] }],
    assignments: [
      { recipient: { kind: 'workgroup', workgroupId: 'wg-hed-comm' }, action: 'message', reasonId: 'to' },
    ],
    priority: 40,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-hed-vendor-tq',
    name: 'Vendor data — technical query routing',
    description: 'Manually-triggered TQ routing for vendor data packages.',
    triggers: [{ kind: 'manual' }],
    conditions: [{ field: 'tags', operator: 'contains', values: ['vendor'] }],
    assignments: [
      { recipient: { kind: 'user', userId: 'u-dkumar' }, action: 'technical-query', reasonId: 'assigned' },
    ],
    priority: 50,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-hed-shiploader-rfi',
    name: 'Shiploader RFI routing',
    triggers: [{ kind: 'manual' }],
    conditions: [{ field: 'asset', operator: 'is', values: ['Shiploader SL-3'] }],
    assignments: [
      { recipient: { kind: 'user', userId: 'u-kwhite' }, action: 'rfi', reasonId: 'assigned' },
    ],
    priority: 50,
    enabled: false,
    ...stamp,
  },
  {
    id: 'r-hed-superseded-notice',
    name: 'Superseded notice to DC',
    description: 'Time-boxed during the berth cutover window.',
    triggers: [{ kind: 'status-change', toStatus: 'Superseded' }],
    conditions: [{ field: 'status', operator: 'is', values: ['Superseded'] }],
    assignments: [
      { recipient: { kind: 'workgroup', workgroupId: 'wg-hed-dc' }, action: 'message', reasonId: 'to' },
    ],
    priority: 60,
    enabled: true,
    effectiveFrom: '2026-05-01',
    effectiveUntil: '2026-12-31',
    ...stamp,
  },
];

const marraRidgeRules: AdRule[] = [
  {
    id: 'r-mr-drawings-review',
    name: 'Engineering drawings for formal review',
    triggers: [{ kind: 'upload' }],
    conditions: [{ field: 'documentType', operator: 'is', values: ['Drawing'] }],
    assignments: [
      { recipient: { kind: 'workgroup', workgroupId: 'wg-mr-eng' }, action: 'formal-review', reasonId: 'lead' },
      { recipient: { kind: 'workgroup', workgroupId: 'wg-mr-dc' }, action: 'message', reasonId: 'cc' },
    ],
    priority: 20,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-mr-specs-approval',
    name: 'Specifications for approval',
    triggers: [{ kind: 'upload' }],
    conditions: [{ field: 'documentType', operator: 'is', values: ['Specification'] }],
    assignments: [
      { recipient: { kind: 'user', userId: 'u-jsmith' }, action: 'formal-approval', reasonId: 'assigned' },
    ],
    priority: 25,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-mr-enviro',
    name: 'Environmental reports to HSE',
    triggers: [{ kind: 'upload' }],
    conditions: [{ field: 'tags', operator: 'contains', values: ['environmental'] }],
    assignments: [
      { recipient: { kind: 'workgroup', workgroupId: 'wg-mr-hse' }, action: 'formal-review', reasonId: 'lead' },
    ],
    priority: 30,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-mr-approved-client',
    name: 'Approved documents — transmittal to owner',
    triggers: [{ kind: 'status-change', toStatus: 'Approved' }],
    conditions: [{ field: 'status', operator: 'is', values: ['Approved'] }],
    assignments: [
      { recipient: { kind: 'workgroup', workgroupId: 'wg-mr-client' }, action: 'transmittal', reasonId: 'to' },
    ],
    priority: 10,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-mr-tailings',
    name: 'Tailings documents — lead review',
    triggers: [{ kind: 'upload' }],
    conditions: [{ field: 'tags', operator: 'contains', values: ['tailings'] }],
    assignments: [
      { recipient: { kind: 'user', userId: 'u-sjohnson' }, action: 'formal-review', reasonId: 'lead' },
      { recipient: { kind: 'user', userId: 'u-mgarcia' }, action: 'formal-review', reasonId: 'commenter' },
    ],
    priority: 15,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-mr-ncr',
    name: 'NCR routing to quality',
    triggers: [{ kind: 'upload' }, { kind: 'manual' }],
    conditions: [{ field: 'tags', operator: 'contains', values: ['NCR'] }],
    assignments: [
      { recipient: { kind: 'user', userId: 'u-tanderson' }, action: 'technical-query', reasonId: 'assigned' },
    ],
    priority: 35,
    enabled: true,
    ...stamp,
  },
];

const kwinanaRules: AdRule[] = [
  {
    id: 'r-kw-process-review',
    name: 'Process drawings for formal review',
    triggers: [{ kind: 'upload' }],
    conditions: [
      { field: 'documentType', operator: 'is', values: ['Drawing'] },
      { field: 'tags', operator: 'contains', values: ['process'] },
    ],
    assignments: [
      { recipient: { kind: 'workgroup', workgroupId: 'wg-kw-process' }, action: 'formal-review', reasonId: 'lead' },
      { recipient: { kind: 'workgroup', workgroupId: 'wg-kw-dc' }, action: 'message', reasonId: 'cc' },
    ],
    priority: 20,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-kw-piping-review',
    name: 'Piping isometrics for formal review',
    triggers: [{ kind: 'upload' }],
    conditions: [{ field: 'tags', operator: 'contains', values: ['piping'] }],
    assignments: [
      { recipient: { kind: 'user', userId: 'u-dkumar' }, action: 'formal-review', reasonId: 'lead' },
    ],
    priority: 25,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-kw-hazop',
    name: 'Process safety studies for approval',
    triggers: [{ kind: 'upload' }],
    conditions: [{ field: 'tags', operator: 'contains', values: ['process safety'] }],
    assignments: [
      { recipient: { kind: 'user', userId: 'u-erodriguez' }, action: 'formal-approval', reasonId: 'assigned' },
      { recipient: { kind: 'user', userId: 'u-mgarcia' }, action: 'formal-approval', reasonId: 'commenter' },
    ],
    priority: 15,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-kw-handover',
    name: 'Systems completion dossiers to client',
    triggers: [{ kind: 'status-change', toStatus: 'Approved' }],
    conditions: [{ field: 'tags', operator: 'contains', values: ['systems completion'] }],
    assignments: [
      { recipient: { kind: 'workgroup', workgroupId: 'wg-kw-client' }, action: 'transmittal', reasonId: 'to' },
      { recipient: { kind: 'workgroup', workgroupId: 'wg-kw-comm' }, action: 'message', reasonId: 'cc' },
    ],
    priority: 10,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-kw-vendor-rfi',
    name: 'Vendor data RFI routing',
    triggers: [{ kind: 'manual' }],
    conditions: [{ field: 'tags', operator: 'contains', values: ['vendor'] }],
    assignments: [
      { recipient: { kind: 'user', userId: 'u-rlee' }, action: 'rfi', reasonId: 'assigned' },
    ],
    priority: 50,
    enabled: true,
    ...stamp,
  },
];

const goldfieldsRules: AdRule[] = [
  {
    id: 'r-gf-track-review',
    name: 'Track drawings for formal review',
    triggers: [{ kind: 'upload' }],
    conditions: [
      { field: 'documentType', operator: 'is', values: ['Drawing'] },
      { field: 'tags', operator: 'contains', values: ['track'] },
    ],
    assignments: [
      { recipient: { kind: 'workgroup', workgroupId: 'wg-gf-rail' }, action: 'formal-review', reasonId: 'lead' },
    ],
    priority: 20,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-gf-signalling-review',
    name: 'Signalling drawings for formal review',
    triggers: [{ kind: 'upload' }],
    conditions: [{ field: 'tags', operator: 'contains', values: ['signalling'] }],
    assignments: [
      { recipient: { kind: 'user', userId: 'u-jwilson' }, action: 'formal-review', reasonId: 'lead' },
      { recipient: { kind: 'workgroup', workgroupId: 'wg-gf-dc' }, action: 'message', reasonId: 'cc' },
    ],
    priority: 20,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-gf-itp-quality',
    name: 'ITP records to quality team',
    triggers: [{ kind: 'upload' }],
    conditions: [{ field: 'tags', operator: 'contains', values: ['ITP'] }],
    assignments: [
      { recipient: { kind: 'workgroup', workgroupId: 'wg-gf-quality' }, action: 'formal-review', reasonId: 'commenter' },
    ],
    priority: 30,
    enabled: true,
    ...stamp,
  },
  {
    id: 'r-gf-heritage',
    name: 'Heritage documents — approval',
    triggers: [{ kind: 'upload' }],
    conditions: [{ field: 'tags', operator: 'contains', values: ['heritage'] }],
    assignments: [
      { recipient: { kind: 'user', userId: 'u-mgarcia' }, action: 'formal-approval', reasonId: 'assigned' },
    ],
    priority: 25,
    enabled: true,
    ...stamp,
  },
];

/** Days to subtract per step back through the synthetic history. */
const HISTORY_STEP_DAYS = 18;

function buildRuleSet(
  workspaceId: ProjectId,
  rules: AdRule[],
  version: number,
  publishedAt: string
): AdRuleSet {
  const published = {
    version,
    rules,
    publishedAt,
    publishedBy: 'u-pbrown',
    summary: 'Reordered review routing and added the manual TQ/RFI rules.',
  };
  // Synthetic earlier versions (each drops the newest rules) so the History
  // tab has believable diffs to show. Capped at two steps back or version 1.
  const history = [published];
  const steps = Math.min(2, version - 1, rules.length - 1);
  for (let step = 1; step <= steps; step++) {
    const at = new Date(new Date(publishedAt).getTime() - step * HISTORY_STEP_DAYS * 86_400_000).toISOString();
    history.push({
      version: version - step,
      rules: rules.slice(0, rules.length - step),
      publishedAt: at,
      publishedBy: step === 1 ? CURRENT_USER_ID : 'u-pbrown',
      summary:
        step === steps
          ? 'Initial rule set migrated from the legacy distribution matrix.'
          : 'Added discipline review coverage after the workshop with the leads.',
    });
  }
  return {
    workspaceId,
    // Draft starts in sync with the published version; edits diverge it.
    draft: { rules, baseVersion: version },
    published,
    history,
  };
}

export const adRuleSetSeedByProject: Record<ProjectId, AdRuleSet> = {
  hedland: buildRuleSet('hedland', hedlandRules, 14, '2026-06-28T09:00:00Z'),
  'marra-ridge': buildRuleSet('marra-ridge', marraRidgeRules, 5, '2026-05-19T14:30:00Z'),
  kwinana: buildRuleSet('kwinana', kwinanaRules, 3, '2026-04-02T11:15:00Z'),
  goldfields: buildRuleSet('goldfields', goldfieldsRules, 2, '2026-03-11T08:45:00Z'),
};
