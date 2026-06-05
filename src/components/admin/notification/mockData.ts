import type { NotificationTemplate } from './types';

type Translate = (key: string, variables?: Record<string, string | number>) => string;

function formatSeedTimestamp(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const token = (name: string, label: string, kind: 'inline' | 'region-start' | 'region-end' = 'inline') =>
  `<span contenteditable="false" data-token="${name}" data-token-kind="${kind}" class="inline-flex items-center rounded-full border border-[#BFD7F2] bg-[#E8F1FB] px-2 py-0.5 text-xs italic text-[#1B4B84]">[${label}]</span>`;

export const getInitialTemplates = (t: Translate, locale: string): NotificationTemplate[] => [
  {
    id: 'tpl-transmittal',
    name: t('admin.notifications.seed.templates.transmittal.name'),
    description: t('admin.notifications.seed.templates.transmittal.description'),
    status: 'Active',
    lastModified: formatSeedTimestamp('2026-06-04T10:12:00', locale),
    notificationType: 'Email',
    subjectHtml: t('admin.notifications.seed.templates.transmittal.subject', {
      documentNumberToken: token('document.number', t('admin.notifications.seed.tokenLabels.documentNumber')),
    }),
    bodyHtml: t('admin.notifications.seed.templates.transmittal.body', {
      displayNameToken: token('recipient.displayName', t('admin.notifications.seed.tokenLabels.displayName')),
      startDocumentListToken: token('document.list.start', t('admin.notifications.tokens.body.startDocumentList'), 'region-start'),
      documentTitleToken: token('document.title', t('admin.notifications.seed.tokenLabels.documentTitle')),
      revisionToken: token('document.revision', t('admin.notifications.seed.tokenLabels.revision')),
      endDocumentListToken: token('document.list.end', t('admin.notifications.tokens.body.endDocumentList'), 'region-end'),
    }),
  },
  {
    id: 'tpl-review-assigned',
    name: t('admin.notifications.seed.templates.reviewAssigned.name'),
    description: t('admin.notifications.seed.templates.reviewAssigned.description'),
    status: 'Draft',
    lastModified: formatSeedTimestamp('2026-06-03T17:45:00', locale),
    notificationType: 'Digest',
    subjectHtml: t('admin.notifications.seed.templates.reviewAssigned.subject', {
      activityNameToken: token('activity.name', t('admin.notifications.seed.tokenLabels.activityName')),
    }),
    bodyHtml: t('admin.notifications.seed.templates.reviewAssigned.body', {
      displayNameToken: token('recipient.displayName', t('admin.notifications.seed.tokenLabels.displayName')),
      activityNameToken: token('activity.name', t('admin.notifications.seed.tokenLabels.activityName')),
      workspaceNameToken: token('workspace.name', t('admin.notifications.seed.tokenLabels.workspaceName')),
      dueDateToken: token('date.due', t('admin.notifications.seed.tokenLabels.dueDate')),
      entryLinkToken: token('entry.link', t('admin.notifications.seed.tokenLabels.entryLink')),
    }),
  },
  {
    id: 'tpl-approval-notification',
    name: t('admin.notifications.seed.templates.approvalNotification.name'),
    description: t('admin.notifications.seed.templates.approvalNotification.description'),
    status: 'Active',
    lastModified: formatSeedTimestamp('2026-06-01T09:30:00', locale),
    notificationType: 'Email',
    subjectHtml: t('admin.notifications.seed.templates.approvalNotification.subject', {
      documentNumberToken: token('document.number', t('admin.notifications.seed.tokenLabels.documentNumber')),
    }),
    bodyHtml: t('admin.notifications.seed.templates.approvalNotification.body', {
      documentNumberToken: token('document.number', t('admin.notifications.seed.tokenLabels.documentNumber')),
      displayNameToken: token('recipient.displayName', t('admin.notifications.seed.tokenLabels.displayName')),
    }),
  },
  {
    id: 'tpl-distribution-complete',
    name: t('admin.notifications.seed.templates.distributionComplete.name'),
    description: t('admin.notifications.seed.templates.distributionComplete.description'),
    status: 'Draft',
    lastModified: formatSeedTimestamp('2026-05-31T14:08:00', locale),
    notificationType: 'Push (Planned)',
    subjectHtml: t('admin.notifications.seed.templates.distributionComplete.subject', {
      workspaceNameToken: token('workspace.name', t('admin.notifications.seed.tokenLabels.workspaceName')),
    }),
    bodyHtml: t('admin.notifications.seed.templates.distributionComplete.body', {
      workspaceNameToken: token('workspace.name', t('admin.notifications.seed.tokenLabels.workspaceName')),
    }),
  },
];
