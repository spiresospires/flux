// [MOCK] Static dashboard data (todos, notifications, activity) for the Dashboard page.
// [API] G03:GET /workspaces/{wsId}/dashboard — [TBD] endpoint not confirmed (ARCHITECTURE.md open question 2)
// [API] G13:GET /workspaces/{wsId}/messages — notification feed; mark-read is PATCH /messages/{msgId}
// [AUTH]
// [PHASE-1]
// [TODO-ENG] Confirm whether dashboard stats come from a G03 workspace summary or a dedicated G26 endpoint.

export type TodoPriority = 'High' | 'Medium' | 'Low';
export type TodoStatus = 'Overdue' | 'Due Today' | 'Due Soon' | 'Pending';
export type TodoCategory = 'Review' | 'Approval' | 'Transmittal' | 'Workflow' | 'Comment';

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  category: TodoCategory;
  priority: TodoPriority;
  status: TodoStatus;
  dueDate: string;
  project: string;
  assignedBy: string;
  objectType: 'document' | 'transmittal' | 'review' | 'workflow';
  objectId: string;
}

export type NotificationSeverity = 'Info' | 'Warning' | 'Action Required';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  severity: NotificationSeverity;
  timestamp: string;
  isRead: boolean;
  project: string;
  category: 'Review' | 'Transmittal' | 'Workflow' | 'Document' | 'System';
  objectType: 'document' | 'transmittal' | 'review' | 'workflow';
  objectId: string;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  project: string;
  category: 'Review' | 'Transmittal' | 'Workflow' | 'Document' | 'Package';
  objectType: 'document' | 'transmittal' | 'review' | 'workflow' | 'package';
  objectId: string;
  user: string;
}

export type SharedItemType = 'folder' | 'search' | 'document' | 'report';

export interface SharedItem {
  id: string;
  name: string;
  type: SharedItemType;
  sharedBy: string;
  sharedAt: string;
  project: string;
  description?: string;
  objectId: string;
}

export type FavouriteType = 'document' | 'folder' | 'package' | 'report' | 'search';

export interface FavouriteItem {
  id: string;
  name: string;
  type: FavouriteType;
  project: string;
  addedAt: string;
  description?: string;
  objectId: string;
  status?: string;
}

// --- Mock data ---

export const mockTodos: TodoItem[] = [
  {
    id: 'todo-1',
    title: 'Review P&ID Drawing Rev C',
    description: 'Review and approve the updated P&ID drawing for the east processing unit.',
    category: 'Review',
    priority: 'High',
    status: 'Overdue',
    dueDate: '2026-05-08',
    project: 'Kwinana Lithium Hydroxide Plant',
    assignedBy: 'Sarah Chen',
    objectType: 'review',
    objectId: 'rev-101',
  },
  {
    id: 'todo-2',
    title: 'Approve Transmittal TRS-2026-0041',
    description: 'Client transmittal requires sign-off before end of day.',
    category: 'Transmittal',
    priority: 'High',
    status: 'Due Today',
    dueDate: '2026-05-12',
    project: 'Goldfields Rail Duplication',
    assignedBy: 'James Worthington',
    objectType: 'transmittal',
    objectId: 'trs-0041',
  },
  {
    id: 'todo-3',
    title: 'Comment Response — Structural Calc',
    description: 'Respond to client comments on structural calculation report SC-2024-187.',
    category: 'Comment',
    priority: 'Medium',
    status: 'Due Soon',
    dueDate: '2026-05-14',
    project: 'Kwinana Lithium Hydroxide Plant',
    assignedBy: 'Marcus Reid',
    objectType: 'document',
    objectId: 'doc-22',
  },
  {
    id: 'todo-4',
    title: 'Approval: Fire Safety Specification',
    description: 'Final approval gate for the fire safety specification before issue.',
    category: 'Approval',
    priority: 'High',
    status: 'Due Soon',
    dueDate: '2026-05-15',
    project: 'Port Hedland Berth 6 Expansion',
    assignedBy: 'Priya Nair',
    objectType: 'document',
    objectId: 'doc-14',
  },
  {
    id: 'todo-5',
    title: 'Workflow Step: IFC Package Compilation',
    description: 'Complete compilation step for Issued-for-Construction package batch.',
    category: 'Workflow',
    priority: 'Medium',
    status: 'Pending',
    dueDate: '2026-05-20',
    project: 'Marra Ridge Iron Ore Mine',
    assignedBy: 'Li Wei',
    objectType: 'workflow',
    objectId: 'wf-55',
  },
  {
    id: 'todo-6',
    title: 'Review MEP Coordination Drawing',
    description: 'Cross-discipline review of MEP coordination for levels 12–18.',
    category: 'Review',
    priority: 'Low',
    status: 'Pending',
    dueDate: '2026-05-22',
    project: 'Kwinana Lithium Hydroxide Plant',
    assignedBy: 'Emma Lawson',
    objectType: 'review',
    objectId: 'rev-108',
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Review assigned to you',
    description: 'You have been assigned to review Piping Isometric ISO-44-C on the Kwinana project.',
    severity: 'Action Required',
    timestamp: '2026-05-12T08:22:00',
    isRead: false,
    project: 'Kwinana Lithium Hydroxide Plant',
    category: 'Review',
    objectType: 'review',
    objectId: 'rev-112',
  },
  {
    id: 'notif-2',
    title: 'Transmittal TRS-2026-0039 returned',
    description: 'The client has returned transmittal TRS-2026-0039 with comments.',
    severity: 'Warning',
    timestamp: '2026-05-12T07:45:00',
    isRead: false,
    project: 'Goldfields Rail Duplication',
    category: 'Transmittal',
    objectType: 'transmittal',
    objectId: 'trs-0039',
  },
  {
    id: 'notif-3',
    title: 'Document superseded',
    description: 'DOC-2024-0187 has been superseded by a new revision uploaded by James Worthington.',
    severity: 'Info',
    timestamp: '2026-05-11T16:10:00',
    isRead: false,
    project: 'Goldfields Rail Duplication',
    category: 'Document',
    objectType: 'document',
    objectId: 'doc-187',
  },
  {
    id: 'notif-4',
    title: 'Workflow step completed',
    description: 'Li Wei completed the "Internal Check" step on workflow WF-2026-055.',
    severity: 'Info',
    timestamp: '2026-05-11T14:30:00',
    isRead: true,
    project: 'Marra Ridge Iron Ore Mine',
    category: 'Workflow',
    objectType: 'workflow',
    objectId: 'wf-55',
  },
  {
    id: 'notif-5',
    title: 'Comment period closing',
    description: 'The comment period for Structural Calc SC-2024-187 closes in 2 days.',
    severity: 'Warning',
    timestamp: '2026-05-11T09:00:00',
    isRead: true,
    project: 'Kwinana Lithium Hydroxide Plant',
    category: 'Document',
    objectType: 'document',
    objectId: 'doc-22',
  },
  {
    id: 'notif-6',
    title: 'New package shared with you',
    description: 'Priya Nair shared Package PKG-IFC-B12 with you for review.',
    severity: 'Info',
    timestamp: '2026-05-10T11:20:00',
    isRead: true,
    project: 'Port Hedland Berth 6 Expansion',
    category: 'Transmittal',
    objectType: 'transmittal',
    objectId: 'pkg-ifc-b12',
  },
];

export const mockRecentActivity: RecentActivityItem[] = [
  {
    id: 'act-1',
    action: 'Document uploaded',
    description: 'Piping Isometric ISO-44-C (Rev C) uploaded to Civil / Piping folder.',
    timestamp: '2026-05-12T08:05:00',
    project: 'Kwinana Lithium Hydroxide Plant',
    category: 'Document',
    objectType: 'document',
    objectId: 'doc-iso44c',
    user: 'You',
  },
  {
    id: 'act-2',
    action: 'Review completed',
    description: 'Review REV-101 for P&ID Drawing completed with 3 comments.',
    timestamp: '2026-05-11T17:30:00',
    project: 'Kwinana Lithium Hydroxide Plant',
    category: 'Review',
    objectType: 'review',
    objectId: 'rev-101',
    user: 'You',
  },
  {
    id: 'act-3',
    action: 'Transmittal issued',
    description: 'Transmittal TRS-2026-0041 issued to Arcadia Group.',
    timestamp: '2026-05-11T15:00:00',
    project: 'Goldfields Rail Duplication',
    category: 'Transmittal',
    objectType: 'transmittal',
    objectId: 'trs-0041',
    user: 'James Worthington',
  },
  {
    id: 'act-4',
    action: 'Package created',
    description: 'Package PKG-IFC-B12 created with 24 documents.',
    timestamp: '2026-05-10T13:45:00',
    project: 'Port Hedland Berth 6 Expansion',
    category: 'Package',
    objectType: 'package',
    objectId: 'pkg-ifc-b12',
    user: 'Priya Nair',
  },
  {
    id: 'act-5',
    action: 'Document approved',
    description: 'Fire Safety Specification FSS-2026-001 approved at Rev B.',
    timestamp: '2026-05-09T10:20:00',
    project: 'Port Hedland Berth 6 Expansion',
    category: 'Document',
    objectType: 'document',
    objectId: 'doc-14',
    user: 'You',
  },
  {
    id: 'act-6',
    action: 'Workflow advanced',
    description: 'Workflow WF-2026-055 advanced to "QA Check" step.',
    timestamp: '2026-05-08T16:00:00',
    project: 'Marra Ridge Iron Ore Mine',
    category: 'Workflow',
    objectType: 'workflow',
    objectId: 'wf-55',
    user: 'Li Wei',
  },
];

export const mockSharedItems: SharedItem[] = [
  {
    id: 'shared-1',
    name: 'IFC Package — Block 12',
    type: 'document',
    sharedBy: 'Priya Nair',
    sharedAt: '2026-05-10T11:20:00',
    project: 'Port Hedland Berth 6 Expansion',
    description: 'Package PKG-IFC-B12 with 24 IFC-ready documents.',
    objectId: 'pkg-ifc-b12',
  },
  {
    id: 'shared-2',
    name: 'Civil / Piping (folder)',
    type: 'folder',
    sharedBy: 'Sarah Chen',
    sharedAt: '2026-05-09T09:00:00',
    project: 'Kwinana Lithium Hydroxide Plant',
    description: 'Shared the Civil / Piping folder for cross-team coordination.',
    objectId: 'folder-piping',
  },
  {
    id: 'shared-3',
    name: 'All In-Review Drawings — Q2',
    type: 'search',
    sharedBy: 'Marcus Reid',
    sharedAt: '2026-05-08T14:00:00',
    project: 'Kwinana Lithium Hydroxide Plant',
    description: 'Saved search: status=In Review, type=Drawing, date≥2026-04-01.',
    objectId: 'search-q2-drawings',
  },
  {
    id: 'shared-4',
    name: 'Transmittal Summary Report — May',
    type: 'report',
    sharedBy: 'James Worthington',
    sharedAt: '2026-05-07T10:30:00',
    project: 'Goldfields Rail Duplication',
    description: 'Monthly transmittal summary for May 2026.',
    objectId: 'report-trs-may26',
  },
  {
    id: 'shared-5',
    name: 'Structural Drawings Register',
    type: 'search',
    sharedBy: 'Emma Lawson',
    sharedAt: '2026-05-05T08:45:00',
    project: 'Marra Ridge Iron Ore Mine',
    description: 'Saved view of all structural drawings with revision history.',
    objectId: 'search-struct-register',
  },
];

export const mockFavourites: FavouriteItem[] = [
  {
    id: 'fav-1',
    name: 'P&ID Master Sheet — Rev C',
    type: 'document',
    project: 'Kwinana Lithium Hydroxide Plant',
    addedAt: '2026-05-01',
    description: 'Master P&ID sheet for east processing unit.',
    objectId: 'doc-pid-master',
    status: 'Under Review',
  },
  {
    id: 'fav-2',
    name: 'Civil / Structural (folder)',
    type: 'folder',
    project: 'Kwinana Lithium Hydroxide Plant',
    addedAt: '2026-04-28',
    description: 'Primary structural drawings folder.',
    objectId: 'folder-civil-struct',
  },
  {
    id: 'fav-3',
    name: 'Package PKG-IFC-B12',
    type: 'package',
    project: 'Port Hedland Berth 6 Expansion',
    addedAt: '2026-04-25',
    description: 'IFC Package for Block 12.',
    objectId: 'pkg-ifc-b12',
    status: 'New',
  },
  {
    id: 'fav-4',
    name: 'Overdue Reviews Report',
    type: 'report',
    project: 'Goldfields Rail Duplication',
    addedAt: '2026-04-20',
    description: 'Report tracking overdue review actions across the project.',
    objectId: 'report-overdue-reviews',
  },
  {
    id: 'fav-5',
    name: 'Approved Specs — 2026',
    type: 'search',
    project: 'Goldfields Rail Duplication',
    addedAt: '2026-04-15',
    description: 'Saved search: status=Approved, type=Specification, year=2026.',
    objectId: 'search-approved-specs-2026',
  },
  {
    id: 'fav-6',
    name: 'MEP Coordination Package',
    type: 'package',
    project: 'Kwinana Lithium Hydroxide Plant',
    addedAt: '2026-04-10',
    description: 'MEP coordination package for levels 12–18.',
    objectId: 'pkg-mep-coord',
    status: 'Approved',
  },
];
