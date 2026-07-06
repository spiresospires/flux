// [API] G06:GET /workspaces/{wsId}/documents — cursor-paginated per ADR-011.
// [AUTH]
// [PHASE-1]
import { apiClient } from './client';
import type { Document } from '../types/document';
import type { DocumentListParams, DocumentListResponse } from './types';

export function getDocuments(
  wsId: string,
  params: DocumentListParams
): Promise<DocumentListResponse> {
  const qs = new URLSearchParams();
  if (params.folderId) qs.set('folderId', params.folderId);
  if (params.recursive) qs.set('recursive', 'true');
  params.status?.forEach((s) => qs.append('status', s));
  params.documentType?.forEach((t) => qs.append('documentType', t));
  if (params.sort) qs.set('sort', params.sort);
  if (params.order) qs.set('order', params.order);
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiClient.get<DocumentListResponse>(`/workspaces/${wsId}/documents${suffix}`);
}

export function getDocument(wsId: string, docId: string): Promise<Document> {
  return apiClient.get<Document>(`/workspaces/${wsId}/documents/${docId}`);
}
