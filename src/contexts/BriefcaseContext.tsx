// [MOCK] Briefcase state — localStorage-backed, mirrors ClipboardContext.
// [API] [AUTH] [PHASE-1]
// TODO: replace localStorage internals with GET/POST/DELETE /api/user/briefcase
// (user-scoped, not workspace-scoped) once the FusionLive endpoint is available.
import React, { createContext, useContext, useState } from 'react';
import { PROJECTS, ProjectId } from '../data/projects';
import { BriefcaseInput, BriefcaseItem } from '../types/briefcase';
import { briefcaseSeed } from '../data/briefcaseSeed';

const STORAGE_KEY = 'flux.briefcase';

interface BriefcaseContextType {
  items: BriefcaseItem[];
  count: number;
  add: (input: BriefcaseInput) => void;
  remove: (docId: string) => void;
  removeMany: (docIds: string[]) => void;
  clear: () => void;
  isInBriefcase: (docId: string) => boolean;
  toggleDynamic: (docId: string) => void;
}

const BriefcaseContext = createContext<BriefcaseContextType | undefined>(undefined);

function resolveProjectId(projectName?: string): ProjectId | null {
  if (!projectName) return null;
  return PROJECTS.find((p) => p.name === projectName)?.id ?? null;
}

function persist(items: BriefcaseItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable — non-fatal in the prototype */
  }
}

export function BriefcaseProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BriefcaseItem[]>(() => {
    if (typeof window === 'undefined') return briefcaseSeed;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as BriefcaseItem[]) : briefcaseSeed;
    } catch {
      return briefcaseSeed;
    }
  });

  const add = (input: BriefcaseInput) => {
    setItems((prev) => {
      if (prev.some((i) => i.docId === input.docId)) return prev;
      const item: BriefcaseItem = {
        docId: input.docId,
        title: input.title,
        reference: input.reference ?? input.docId,
        pinnedRevision: input.revision ?? '—',
        status: input.status ?? 'Unknown',
        fileType: input.fileType ?? '—',
        fileSize: input.fileSize,
        author: input.author,
        sourceProjectId: resolveProjectId(input.projectName),
        sourceWorkspaceName: input.projectName ?? 'Unknown workspace',
        folderId: input.folderId,
        isDynamic: false,
        addedAt: new Date().toISOString(),
        state: 'current',
      };
      const updated = [item, ...prev];
      persist(updated);
      return updated;
    });
  };

  const remove = (docId: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.docId !== docId);
      persist(updated);
      return updated;
    });
  };

  const removeMany = (docIds: string[]) => {
    const ids = new Set(docIds);
    setItems((prev) => {
      const updated = prev.filter((i) => !ids.has(i.docId));
      persist(updated);
      return updated;
    });
  };

  const clear = () => {
    setItems([]);
    persist([]);
  };

  const isInBriefcase = (docId: string) => items.some((i) => i.docId === docId);

  const toggleDynamic = (docId: string) => {
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.docId === docId ? { ...i, isDynamic: !i.isDynamic } : i
      );
      persist(updated);
      return updated;
    });
  };

  return (
    <BriefcaseContext.Provider
      value={{ items, count: items.length, add, remove, removeMany, clear, isInBriefcase, toggleDynamic }}
    >
      {children}
    </BriefcaseContext.Provider>
  );
}

export function useBriefcase() {
  const ctx = useContext(BriefcaseContext);
  if (!ctx) {
    throw new Error('useBriefcase must be used within a BriefcaseProvider');
  }
  return ctx;
}
