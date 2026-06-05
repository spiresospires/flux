export type TemplateStatus = 'Active' | 'Draft' | 'Archived';

export type NotificationType = 'Email' | 'Digest' | 'Push (Planned)';

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  status: TemplateStatus;
  lastModified: string;
  notificationType: NotificationType;
  subjectHtml: string;
  bodyHtml: string;
}
