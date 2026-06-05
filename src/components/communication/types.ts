export type CommunicationType = 'general' | 'rfi' | 'tq';

export type CommunicationPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface LinkedDocumentItem {
  id: string;
  reference?: string;
  title?: string;
  revision?: string;
  status?: string;
  type?: string;
}

export interface CommunicationFormState {
  messageType: CommunicationType;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  linkedDocuments: LinkedDocumentItem[];
  attachments: File[];
  priority: CommunicationPriority;
  requiredResponseDate: string;
  informationRequested: string;
  responseRequired: boolean;
  rfiCategory: string;
  technicalQueryDetails: string;
  discipline: string;
  relatedDocumentReference: string;
  technicalCategory: string;
}

export type CommunicationValidationErrors = Partial<Record<keyof CommunicationFormState, string>>;
