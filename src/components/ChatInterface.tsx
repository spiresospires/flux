import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SendIcon,
  XIcon,
  SparklesIcon,
  FileTextIcon,
  PlusIcon,
  PinIcon,
  PinOffIcon,
  PencilIcon,
  Trash2Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  MoreHorizontalIcon,
  MessageSquareIcon,
  SearchIcon,
  FileIcon } from
'lucide-react';
import { mockDocuments } from '../data/mockDocuments';
import { statusColors } from './DocumentCard';
import { LeftRail } from './LeftRail';
import { ClipboardPanel } from './ClipboardPanel';
import { useClipboard } from '../contexts/ClipboardContext';
import { useScope } from '../contexts/ScopeContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { Document } from '../types/document';
interface ChatInterfaceProps {
  onExit: () => void;
  onDocumentSelect: (docId: string) => void;
  askAbout?: string | null;
  askKind?: 'folder' | 'document' | null;
}
interface ChatMessage {
  id: string;
  content: React.ReactNode;
  sender: 'user' | 'flint';
  timestamp: string;
  attachments?: Document[];
}
type ChatScope =
  | { kind: 'enterprise' }
  | { kind: 'project'; id: string; name: string };

interface ProjectOption { id: string; name: string }

const PROJECTS: ProjectOption[] = [
  { id: 'shard', name: 'The Shard, London' },
  { id: 'skyline', name: 'Skyline' },
  { id: 'tower', name: 'Tower' },
  { id: 'empire', name: 'Empire State' }
];

const ENTERPRISE_SCOPE: ChatScope = { kind: 'enterprise' };
const projectScope = (id: string): ChatScope => {
  const p = PROJECTS.find((x) => x.id === id) ?? PROJECTS[0];
  return { kind: 'project', id: p.id, name: p.name };
};
const scopesEqual = (a: ChatScope, b: ChatScope) =>
  a.kind === b.kind && (a.kind === 'enterprise' || (b.kind === 'project' && a.id === b.id));

interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: number;
  messages: ChatMessage[];
  scope: ChatScope;
}
// Pick real documents from mock data for AI responses
const getSpecDocuments = () => {
  const specs = mockDocuments.filter((d) => d.documentType === 'Specification');
  return specs.slice(0, 3);
};
const getMechDocuments = () => {
  const mechs = mockDocuments.filter(
    (d) =>
    d.documentType === 'Drawing' &&
    d.folderId === 'folder-drawings-mechanical'
  );
  return mechs.slice(0, 3);
};
const getSafetyDocuments = () => {
  const safety = mockDocuments.filter(
    (d) =>
    d.documentType === 'Procedure' &&
    d.folderId === 'folder-procedures-safety'
  );
  return safety.slice(0, 3);
};
export function ChatInterface({
  onExit,
  onDocumentSelect,
  askAbout,
  askKind
}: ChatInterfaceProps) {
  const { t } = useLocalization();
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const day = 86400000;
    const now = Date.now();
    const t = (offset: number) =>
    new Date(now - offset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mk = (id: string, sender: 'user' | 'flint', content: React.ReactNode, offset: number): ChatMessage => ({
      id, sender, content, timestamp: t(offset)
    });

    return [
    {
      id: 'c-tag-pv101', title: t('chat.conversations.tagPv101Title'), pinned: true, scope: projectScope('shard'), updatedAt: now - 2 * 3600000,
      messages: [
      mk('m1', 'user', 'What documents are associated with TAG PV-101?', 2 * 3600000),
      mk('m2', 'flint',
      <div>
            <p className="mb-2">PV-101 (Knock-out Drum) is referenced in 6 controlled documents:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>P-1001-PID-001 — Cooling Water Loop P&ID (Rev C)</li>
              <li>M-3012-GA-006 — Pump Skid 06 GA (Rev B)</li>
              <li>SPEC-EQUIP-017-R1 — Heat Exchanger Specification</li>
              <li>VEN-DS-003-R1 — Vendor Datasheet (Approved)</li>
              <li>RPT-HSE-012-R1 — HSE Audit Report</li>
              <li>WP-MECH-AREA-01 — IFC Workpack</li>
            </ul>
            <p className="mt-2 text-sm">All references are in folders <code>/Process/PIDs</code> and <code>/Mechanical/Area 01/GA</code>.</p>
          </div>, 2 * 3600000 - 60000),
      mk('m3', 'user', 'Are any of those superseded?', 2 * 3600000 - 30 * 60000),
      mk('m4', 'flint', 'No, all current revisions are the latest. SPEC-EQUIP-017 has a draft Rev 2 in progress with Kevin White but not yet released.', 2 * 3600000 - 29 * 60000)]

    },
    {
      id: 'c-latest-pid', title: t('chat.conversations.latestPidTitle'), pinned: true, scope: projectScope('shard'), updatedAt: now - 5 * 3600000,
      messages: [
      mk('m1', 'user', "What's the latest revision of P-1001-PID-001?", 5 * 3600000),
      mk('m2', 'flint', 'The latest released revision is Rev C (Approved on 28 Apr 2026 by Sarah Chen). Rev D is currently in review with the lead process engineer.', 5 * 3600000 - 90000),
      mk('m3', 'user', 'Show me the change between B and C.', 5 * 3600000 - 10 * 60000),
      mk('m4', 'flint', 'Between Rev B → Rev C: cooling water return line re-routed to header HDR-04, valve XV-3402 added downstream of E-201, line size on 4"-CW-02 increased to 6". Redline PDF available in version history.', 5 * 3600000 - 9 * 60000)]

    },
    {
      id: 'c-pumps-dwg', title: t('chat.conversations.pumpsTitle'), pinned: false, scope: projectScope('shard'), updatedAt: now - 1 * day,
      messages: [
      mk('m1', 'user', 'List the pumps on drawing M-3012-GA-006.', 1 * day),
      mk('m2', 'flint',
      <div>
            <p className="mb-2">Drawing M-3012-GA-006 (Pump Skid 06 GA) shows 4 pumps:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>P-204A — Centrifugal cooling water pump (duty)</li>
              <li>P-204B — Centrifugal cooling water pump (standby)</li>
              <li>P-205 — Booster pump, vertical inline</li>
              <li>P-206 — Sump pump, submersible</li>
            </ul>
          </div>, 1 * day - 60000)]

    },
    {
      id: 'c-supersede', title: t('chat.conversations.supersedeTitle'), pinned: false, scope: projectScope('skyline'), updatedAt: now - 1 * day - 4 * 3600000,
      messages: [
      mk('m1', 'user', 'Which drawings supersede DWG-MECH-027-R3?', 1 * day + 4 * 3600000),
      mk('m2', 'flint', 'DWG-MECH-027-R3 has been superseded by DWG-MECH-027-R4 (released 02 May 2026). The R4 revision incorporates the structural support modifications from RFI-2026-118.', 1 * day + 4 * 3600000 - 60000)]

    },
    {
      id: 'c-loop-101', title: t('chat.conversations.loopSheetTitle'), pinned: false, scope: projectScope('skyline'), updatedAt: now - 2 * day,
      messages: [
      mk('m1', 'user', 'Find the loop sheet for FT-205.', 2 * day),
      mk('m2', 'flint', 'Loop sheet INST-LOOP-205-R2 covers FT-205 (Coriolis flow transmitter on cooling water return). Linked instruments: FY-205, FV-205, FAH-205. Located in /Instrumentation/Loop Sheets.', 2 * day - 60000),
      mk('m3', 'user', 'What is the calibration range?', 2 * day - 20 * 60000),
      mk('m4', 'flint', 'Per loop sheet: 0–1500 kg/h, 4–20 mA, accuracy ±0.5%. Last calibrated 14 Mar 2026.', 2 * day - 19 * 60000)]

    },
    {
      id: 'c-vendor-pump', title: t('chat.conversations.vendorPumpTitle'), pinned: false, scope: ENTERPRISE_SCOPE, updatedAt: now - 2 * day - 5 * 3600000,
      messages: [
      mk('m1', 'user', 'Show vendor datasheets for P-204A.', 2 * day + 5 * 3600000),
      mk('m2', 'flint', 'Two vendor datasheets are linked to P-204A: VEN-DS-003-R1 (Sulzer mechanical) and VEN-DS-016-R1 (motor). Both Approved, current revision.', 2 * day + 5 * 3600000 - 60000)]

    },
    {
      id: 'c-outstanding', title: t('chat.conversations.pendingReviewTitle'), pinned: false, scope: projectScope('tower'), updatedAt: now - 3 * day,
      messages: [
      mk('m1', 'user', 'Any documents pending review on Substation A?', 3 * day),
      mk('m2', 'flint', '3 documents are in review: E-2004-SLD-015 (415V SLD, Rev B), E-2004-PRT-008 (Protection Schematic, Draft), and SPEC-ELEC-022-R1. Reviewer: Daniel Park, due 12 May.', 3 * day - 60000)]

    },
    {
      id: 'c-mech-area01', title: t('chat.conversations.ifcTitle'), pinned: false, scope: projectScope('shard'), updatedAt: now - 4 * day,
      messages: [
      mk('m1', 'user', 'List IFC documents for Mechanical Area 01.', 4 * day),
      mk('m2', 'flint', 'Workpack WP-MECH-AREA-01 (Rev C02) contains 42 IFC-status documents across GA, P&IDs, isometrics and civil layouts. Want me to open the package?', 4 * day - 60000)]

    },
    {
      id: 'c-piping-class', title: t('chat.conversations.pipingClassTitle'), pinned: false, scope: ENTERPRISE_SCOPE, updatedAt: now - 5 * day,
      messages: [
      mk('m1', 'user', 'Compare piping class 150# CS for cooling water vs utility air.', 5 * day),
      mk('m2', 'flint', 'Per PIPING-CLASS-150CS-R3: cooling water service uses A106 Gr B SMLS, schedule 40, 1/16" CA. Utility air uses A53 Gr B ERW, schedule 40, no CA. Both are limited to 200°F at 285 psig.', 5 * day - 60000)]

    },
    {
      id: 'c-safety-200', title: t('chat.conversations.confinedSpaceTitle'), pinned: false, scope: ENTERPRISE_SCOPE, updatedAt: now - 6 * day,
      messages: [
      mk('m1', 'user', 'Summarise confined space procedures for Unit 200.', 6 * day),
      mk('m2', 'flint', 'PROC-SAFE-003-R3 covers Unit 200 confined space entry. Key points: gas test before entry, continuous monitoring, attendant + entry permit, rescue plan ref RES-PLAN-200.', 6 * day - 60000)]

    },
    {
      id: 'c-cable-sched', title: t('chat.conversations.cableScheduleTitle'), pinned: false, scope: projectScope('skyline'), updatedAt: now - 7 * day,
      messages: [
      mk('m1', 'user', 'Cable schedule for MCC-03 feeders?', 7 * day),
      mk('m2', 'flint', 'CAB-SCH-MCC03-R2 lists 28 feeders. Largest is FDR-03-12 (P-204A motor, 4-core 95mm² XLPE, 124 m). Schedule last updated 30 Apr 2026.', 7 * day - 60000)]

    },
    {
      id: 'c-where-used', title: t('chat.conversations.whereUsedTitle'), pinned: false, scope: projectScope('shard'), updatedAt: now - 8 * day,
      messages: [
      mk('m1', 'user', 'Where is XV-3402 referenced?', 8 * day),
      mk('m2', 'flint', 'XV-3402 appears in: P-1001-PID-001 (Rev C), VAL-LIST-AREA01-R5, INST-LOOP-3402-R1, and SPEC-VAL-014-R2. It is also called up in commissioning procedure CMS-PRC-018.', 8 * day - 60000)]

    },
    {
      id: 'c-redline', title: t('chat.conversations.redlinesTitle'), pinned: false, scope: projectScope('empire'), updatedAt: now - 9 * day,
      messages: [
      mk('m1', 'user', 'Any open redlines on Civil Foundations?', 9 * day),
      mk('m2', 'flint', 'WP-CIV-FOUND-PKG has 2 open redlines: C-4401-LAY-002 (footing depth comment) and C-4401-LAY-005 (rebar spacing query). Both raised by Marco Rossi.', 9 * day - 60000)]

    },
    {
      id: 'c-transmittals', title: t('chat.conversations.transmittalsTitle'), pinned: false, scope: ENTERPRISE_SCOPE, updatedAt: now - 11 * day,
      messages: [
      mk('m1', 'user', 'How many transmittals went to Contractor X this month?', 11 * day),
      mk('m2', 'flint', '7 transmittals to Contractor X in May 2026, totalling 184 documents. 3 are awaiting acknowledgement: TR-2026-118, TR-2026-122, TR-2026-127.', 11 * day - 60000)]

    },
    {
      id: 'c-hold-points', title: t('chat.conversations.holdPointsTitle'), pinned: false, scope: projectScope('shard'), updatedAt: now - 14 * day,
      messages: [
      mk('m1', 'user', 'List the hold points on Commissioning Pack 03.', 14 * day),
      mk('m2', 'flint', 'CMS-PCK-03 has 4 hold points: H1 hydrotest sign-off, H2 NDT acceptance, H3 instrument loop check, H4 client witnessed run-in. H1 and H2 cleared; H3 in progress.', 14 * day - 60000)]

    }];

  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const { scope, setScope } = useScope();
  const askAboutRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (askAbout && askAbout !== askAboutRef.current) {
      askAboutRef.current = askAbout;
      setActiveId(null);
      setInputValue('');
    }
  }, [askAbout]);
  const scopedConversations = conversations.filter((c) => scopesEqual(c.scope, scope));
  const [historyOpen, setHistoryOpen] = useState(true);
  const [historyWidth, setHistoryWidth] = useState(288);
  const resizingRef = useRef(false);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const next = Math.min(560, Math.max(240, e.clientX - 56));
      setHistoryWidth(next);
    };
    const onUp = () => {
      if (resizingRef.current) {
        resizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);
  const startResize = () => {
    resizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const active = conversations.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];
  const setMessages = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setConversations((prev) => {
      let id = activeId;
      let list = prev;
      if (!id) {
        id = 'c-' + Date.now();
        list = [{ id, title: t('chat.newChat'), pinned: false, scope, updatedAt: Date.now(), messages: [] }, ...prev];
        setActiveId(id);
      }
      return list.map((c) =>
      c.id === id ? { ...c, messages: updater(c.messages), updatedAt: Date.now() } : c
      );
    });
  };
  const [inputValue, setInputValue] = useState('');
  const [clipboardPanelOpen, setClipboardPanelOpen] = useState(false);
  const [selectedClipboardDocs, setSelectedClipboardDocs] = useState<Document[]>([]);
  const { clipboard } = useClipboard();
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const removePendingAttachment = (docId: string) => {
    setSelectedClipboardDocs((prev) => prev.filter((doc) => doc.id !== docId));
  };
  const renderAttachmentChips = (
    docs: Document[],
    options?: {
      removable?: boolean;
      onRemove?: (docId: string) => void;
      tone?: 'draft' | 'sent';
    }
  ) => {
    const tone = options?.tone ?? 'draft';
    const removable = options?.removable ?? false;
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${
              tone === 'sent'
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-[#E8F1FB] border-[#0461BA]/30 text-[#0461BA]'
            }`}>
            <FileIcon size={12} className={tone === 'sent' ? 'text-white' : 'text-[#0461BA]'} />
            <span className="text-xs font-medium">{doc.id}</span>
            {removable && options?.onRemove && (
              <button
                onClick={() => options.onRemove?.(doc.id)}
                className={`transition-colors ${
                  tone === 'sent'
                    ? 'text-white/70 hover:text-white'
                    : 'text-[#0461BA]/60 hover:text-[#0461BA]'
                }`}
                aria-label={t('clipboard.removeFromClipboard', { id: doc.id })}>
                <XIcon size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };
  const renderClipboardTrigger = () => (
    <button
      onClick={() => setClipboardPanelOpen(true)}
      title={`${t('chat.clipboardTriggerAria')} (${clipboard.length})`}
      className="w-12 h-12 rounded-full bg-white border border-neutral-200 hover:bg-[#F0F4F8] text-neutral-600 flex items-center justify-center transition-colors shrink-0 shadow-sm relative"
      aria-label={t('chat.clipboardTriggerAria')}>
      <PlusIcon size={18} />
      {clipboard.length > 0 && (
        <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-[#0461BA] text-white text-[10px] font-bold flex items-center justify-center">
          {clipboard.length}
        </span>
      )}
    </button>
  );
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  const buildResponseForQuery = (query: string, attachments: Document[] = []): React.ReactNode => {
    const lowerQuery = query.toLowerCase();
    if (!lowerQuery && attachments.length > 0) {
      return (
        <div>
          <p className="mb-3">
            {t('chat.contextIntro')}
          </p>
          <div className="space-y-2 mb-3">
            {attachments.map((doc) =>
            <button
              key={doc.id}
              onClick={() => onDocumentSelect(doc.id)}
              className="w-full flex items-center gap-3 p-3 bg-[#F0F4F8] border border-neutral-200 rounded-lg hover:bg-neutral-200 hover:border-[#0461BA]/30 transition-colors group text-left">

                <div className="w-10 h-10 rounded-md bg-[#E8F1FB] flex items-center justify-center text-[#0461BA] shrink-0">
                  <FileTextIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-neutral-900 group-hover:text-[#0461BA] transition-colors truncate">
                    {doc.id}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">
                    {doc.title}
                  </div>
                </div>
                <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${statusColors[doc.status]}`}>

                  {doc.status}
                </span>
              </button>
            )}
          </div>
          <p className="text-sm text-neutral-600">
            {t('chat.attachmentsHelp')}
          </p>
        </div>);

    }
    if (
    lowerQuery.includes('tensile') ||
    lowerQuery.includes('pressure') ||
    lowerQuery.includes('spec') ||
    lowerQuery.includes('revision'))
    {
      const docs = getSpecDocuments();
      return (
        <div>
          <p className="mb-3">
            {t('chat.specsIntro')}
          </p>
          <div className="space-y-2 mb-3">
            {docs.map((doc) =>
            <button
              key={doc.id}
              onClick={() => onDocumentSelect(doc.id)}
              className="w-full flex items-center gap-3 p-3 bg-[#F0F4F8] border border-neutral-200 rounded-lg hover:bg-neutral-200 hover:border-[#0461BA]/30 transition-colors group text-left">
              
                <div className="w-10 h-10 rounded-md bg-[#E8F1FB] flex items-center justify-center text-[#0461BA] shrink-0">
                  <FileTextIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-neutral-900 group-hover:text-[#0461BA] transition-colors truncate">
                    {doc.id}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">
                    {doc.title}
                  </div>
                </div>
                <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${statusColors[doc.status]}`}>
                
                  {doc.status}
                </span>
              </button>
            )}
          </div>
          <p className="text-sm text-neutral-600">
            {t('chat.openInGrid')}
          </p>
        </div>);

    }
    if (
    lowerQuery.includes('piping') ||
    lowerQuery.includes('material') ||
    lowerQuery.includes('compare'))
    {
      const docs = getMechDocuments();
      return (
        <div>
          <p className="mb-3">
            {t('chat.mechanicalIntro')}
          </p>
          <div className="space-y-2 mb-3">
            {docs.map((doc) =>
            <button
              key={doc.id}
              onClick={() => onDocumentSelect(doc.id)}
              className="w-full flex items-center gap-3 p-3 bg-[#F0F4F8] border border-neutral-200 rounded-lg hover:bg-neutral-200 hover:border-[#0461BA]/30 transition-colors group text-left">
              
                <div className="w-10 h-10 rounded-md bg-[#E8F1FB] flex items-center justify-center text-[#0461BA] shrink-0">
                  <FileTextIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-neutral-900 group-hover:text-[#0461BA] transition-colors truncate">
                    {doc.id}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">
                    {doc.title}
                  </div>
                </div>
                <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${statusColors[doc.status]}`}>
                
                  {doc.status}
                </span>
              </button>
            )}
          </div>
          <p className="text-sm text-neutral-600">
            {t('chat.openInGrid')}
          </p>
        </div>);

    }
    if (
    lowerQuery.includes('safety') ||
    lowerQuery.includes('procedure') ||
    lowerQuery.includes('confined'))
    {
      const docs = getSafetyDocuments();
      return (
        <div>
          <p className="mb-3">
            {t('chat.safetyIntro')}
          </p>
          <div className="space-y-2 mb-3">
            {docs.map((doc) =>
            <button
              key={doc.id}
              onClick={() => onDocumentSelect(doc.id)}
              className="w-full flex items-center gap-3 p-3 bg-[#F0F4F8] border border-neutral-200 rounded-lg hover:bg-neutral-200 hover:border-[#0461BA]/30 transition-colors group text-left">
              
                <div className="w-10 h-10 rounded-md bg-[#E8F1FB] flex items-center justify-center text-[#0461BA] shrink-0">
                  <FileTextIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-neutral-900 group-hover:text-[#0461BA] transition-colors truncate">
                    {doc.id}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">
                    {doc.title}
                  </div>
                </div>
                <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${statusColors[doc.status]}`}>
                
                  {doc.status}
                </span>
              </button>
            )}
          </div>
          <p className="text-sm text-neutral-600">
            {t('chat.openInGrid')}
          </p>
        </div>);

    }
    // Default fallback with random documents
    const docs = attachments.length > 0 ? attachments : mockDocuments.slice(0, 3);
    return (
      <div>
        <p className="mb-3">
          {attachments.length > 0 ?
          t('chat.attachedPromptResult') :
          t('chat.relatedDocumentsIntro')}
        </p>
        <div className="space-y-2 mb-3">
          {docs.map((doc) =>
          <button
            key={doc.id}
            onClick={() => onDocumentSelect(doc.id)}
            className="w-full flex items-center gap-3 p-3 bg-[#F0F4F8] border border-neutral-200 rounded-lg hover:bg-neutral-200 hover:border-[#0461BA]/30 transition-colors group text-left">
            
              <div className="w-10 h-10 rounded-md bg-[#E8F1FB] flex items-center justify-center text-[#0461BA] shrink-0">
                <FileTextIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-neutral-900 group-hover:text-[#0461BA] transition-colors truncate">
                  {doc.id}
                </div>
                <div className="text-xs text-neutral-500 truncate">
                  {doc.title}
                </div>
              </div>
              <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${statusColors[doc.status]}`}>
              
                {doc.status}
              </span>
            </button>
          )}
        </div>
        <p className="text-sm text-neutral-600">
          {t('chat.openInGrid')}
        </p>
      </div>);

  };
  const handleSend = (overrideValue?: string) => {
    const text = overrideValue || inputValue;
    const attachments = selectedClipboardDocs;
    if (!text.trim() && attachments.length === 0) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      content: text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      attachments
    };
    // Auto-title from first user message
    setConversations((prev) => {
      let id = activeId;
      let list = prev;
      if (!id) {
        const titleSource = text.trim() || attachments.map((doc) => doc.id).join(', ');
        id = 'c-' + Date.now();
        list = [{ id, title: titleSource.slice(0, 40), pinned: false, scope, updatedAt: Date.now(), messages: [] }, ...prev];
        setActiveId(id);
      }
      return list.map((c) => {
        if (c.id !== id) return c;
        const isFirstUser = !c.messages.some((m) => m.sender === 'user');
        const titleSource = text.trim() || attachments.map((doc) => doc.id).join(', ');
        return {
          ...c,
          title: isFirstUser ? titleSource.slice(0, 40) : c.title,
          messages: [...c.messages, userMsg],
          updatedAt: Date.now()
        };
      });
    });
    setInputValue('');
    setSelectedClipboardDocs([]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const flintMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: buildResponseForQuery(text, attachments),
        sender: 'flint',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      setMessages((prev) => [...prev, flintMsg]);
    }, 1200);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const suggestions = askAbout ?
  (() => {
    const subject = askAbout ?? '';
    return [
    t('chat.summariseSubject', { subject }),
    t('chat.whoResponsible', { subject }),
    t('chat.latestActivity', { subject }),
    t('chat.openIssues', { subject }),
    t('chat.recentChanges', { subject })];
  })() :

  [
  t('chat.suggestions.specs'),
  t('chat.suggestions.changes'),
  t('chat.suggestions.compliance')];

  return (
    <motion.div
      initial={{
        opacity: 0
      }}
      animate={{
        opacity: 1
      }}
      exit={{
        opacity: 0
      }}
      transition={{
        duration: 0.25
      }}
      className="fixed inset-x-0 top-[45px] bottom-0 bg-[#F8FAFC] z-30 flex pl-[var(--left-rail-width,88px)]">

      <LeftRail
        activeItem="chat"
        onItemClick={() => onExit()}
        onChatClick={() => {}} />

      {/* Chat history sidebar */}
      <ChatHistorySidebar
        open={historyOpen}
        width={historyWidth}
        onResizeStart={startResize}
        onToggle={() => setHistoryOpen((v) => !v)}
        conversations={scopedConversations}
        activeId={activeId}
        search={historySearch}
        onSearchChange={setHistorySearch}
        renamingId={renamingId}
        renameValue={renameValue}
        menuOpenId={menuOpenId}
        onMenuOpen={setMenuOpenId}
        onSelect={(id) => { setActiveId(id); setMenuOpenId(null); }}
        onNew={() => { setActiveId(null); setMenuOpenId(null); }}
        onPin={(id) => setConversations((prev) => prev.map((c) => c.id === id ? { ...c, pinned: !c.pinned } : c))}
        onDelete={(id) => {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (activeId === id) setActiveId(null);
          setMenuOpenId(null);
        }}
        onStartRename={(id, currentTitle) => { setRenamingId(id); setRenameValue(currentTitle); setMenuOpenId(null); }}
        onRenameChange={setRenameValue}
        onRenameCommit={() => {
          if (renamingId) {
            const t = renameValue.trim() || 'Untitled';
            setConversations((prev) => prev.map((c) => c.id === renamingId ? { ...c, title: t } : c));
          }
          setRenamingId(null);
        }} />

      {/* Right side: chat content */}
      <div className="flex-1 flex flex-col min-w-0">
      {/* Messages Area / Empty State */}
      <div
        className="flex-1 overflow-y-auto flex flex-col"
        role="log"
        aria-live="polite"
        aria-label={t('chat.messagesAria')}>
        
        {messages.length === 0 ?
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full">
            <div className="w-16 h-16 bg-[#F0F4F8] rounded-full flex items-center justify-center mb-4 shadow-sm">
              <SparklesIcon size={32} className="text-[#0461BA]" />
            </div>
            {askAbout ?
          <>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2 text-center">
                {askKind === 'folder'
                  ? t('chat.askAboutFolderTitle', { name: askAbout ?? '' })
                  : askKind === 'document'
                    ? t('chat.askAboutDocumentTitle', { name: askAbout ?? '' })
                    : t('chat.askAboutGenericTitle', { name: askAbout ?? '' })}
              </h2>
              <p className="text-neutral-500 mb-6 text-center text-base">
                {t('chat.suggestionHint')}
              </p>
            </> :
          <>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                {t('chat.title')}
              </h2>
              <p className="text-neutral-500 mb-6 text-center text-lg">
                {t('chat.subtitle')}
              </p>
            </>
          }

            {selectedClipboardDocs.length > 0 && (
              <div className="w-full mb-3 rounded-2xl border border-[#0461BA]/15 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-medium text-neutral-500 mb-2">{t('chat.attachedDocuments')}</p>
                {renderAttachmentChips(selectedClipboardDocs, {
                  removable: true,
                  onRemove: removePendingAttachment
                })}
              </div>
            )}

            {/* Centered Input for Empty State */}
            <div className="w-full max-w-[960px] mx-auto flex items-center gap-3">
              {renderClipboardTrigger()}
              <div className="flex-1 relative shadow-sm rounded-full bg-white border border-neutral-200 focus-within:ring-2 focus-within:ring-[#0461BA] focus-within:border-transparent transition-all">
                <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.inputPlaceholder')}
                className="w-full pl-6 pr-16 py-4 rounded-full bg-transparent text-neutral-900 placeholder-neutral-400 focus:outline-none text-base"
                autoFocus />

                <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() && selectedClipboardDocs.length === 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0461BA] hover:bg-[#035299] disabled:bg-[#F0F4F8] disabled:text-neutral-400 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors">

                  <SendIcon size={18} className="ml-0.5" />
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) =>
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="px-4 py-2 bg-white border border-neutral-200 rounded-full text-sm text-neutral-600 hover:bg-[#F0F4F8] hover:text-[#0461BA] transition-colors">
              
                  {s}
                </button>
            )}
            </div>
          </div> :

        <div className="max-w-[960px] mx-auto w-full px-4 py-4 space-y-4">
            {messages.map((message, index) => {
            const showTimestamp =
            index === 0 ||
            messages[index - 1].timestamp !== message.timestamp;
            return (
              <div key={message.id}>
                  {showTimestamp &&
                <div className="flex justify-center mb-5">
                      <span className="text-xs font-medium text-neutral-400 bg-[#F0F4F8] px-3 py-1 rounded-full">
                        {message.timestamp}
                      </span>
                    </div>
                }
                  <motion.div
                  initial={{
                    opacity: 0,
                    y: 10
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  transition={{
                    duration: 0.25
                  }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                    {message.sender === 'flint' &&
                  <div className="w-8 h-8 rounded-full bg-[#E8F1FB] flex items-center justify-center shrink-0 mr-3 mt-1">
                        <SparklesIcon size={14} className="text-[#0461BA]" />
                      </div>
                  }
                    <div
                    className={`max-w-[75%] px-5 py-4 shadow-sm ${message.sender === 'user' ? 'bg-[#0461BA] text-white rounded-2xl rounded-br-sm ml-auto' : 'bg-white border border-neutral-200 text-neutral-900 rounded-2xl rounded-bl-sm'}`}>
                    
                      {message.sender === 'flint' &&
                    <p className="text-xs font-bold text-[#0461BA] mb-2 uppercase tracking-wider">
                          {t('chat.flintLabel')}
                        </p>
                    }
                      {message.sender === 'user' && message.attachments && message.attachments.length > 0 && (
                        <div className="mb-3">
                          {renderAttachmentChips(message.attachments, { tone: 'sent' })}
                        </div>
                      )}
                      <div className="text-[15px] leading-relaxed">
                        {message.content || (message.sender === 'user' && message.attachments?.length ? t('chat.attachedDocumentsOnly') : null)}
                      </div>
                    </div>
                  </motion.div>
                </div>);

          })}

            {isTyping &&
          <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-[#E8F1FB] flex items-center justify-center shrink-0 mr-3 mt-1">
                  <SparklesIcon size={14} className="text-[#0461BA]" />
                </div>
                <div className="bg-white border border-neutral-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
                  <motion.div
                animate={{
                  y: [0, -5, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6,
                  delay: 0
                }}
                className="w-2 h-2 bg-neutral-300 rounded-full" />
              
                  <motion.div
                animate={{
                  y: [0, -5, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6,
                  delay: 0.2
                }}
                className="w-2 h-2 bg-neutral-300 rounded-full" />
              
                  <motion.div
                animate={{
                  y: [0, -5, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6,
                  delay: 0.4
                }}
                className="w-2 h-2 bg-neutral-300 rounded-full" />
              
                </div>
              </div>
          }
            <div ref={messagesEndRef} />
          </div>
        }
      </div>

      {/* Input Area (Only show when there are messages) */}
      {messages.length > 0 &&
      <div className="bg-white border-t border-neutral-200 p-4 shrink-0">
          {selectedClipboardDocs.length > 0 && (
            <div className="mb-3 max-w-[960px] mx-auto">
              <p className="text-xs font-medium text-neutral-500 mb-2">{t('chat.attachedDocuments')}</p>
              {renderAttachmentChips(selectedClipboardDocs, {
                removable: true,
                onRemove: removePendingAttachment
              })}
            </div>
          )}
          <div className="max-w-[960px] mx-auto flex items-center gap-3">
            <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.followUpPlaceholder')}
            className="flex-1 px-5 py-3.5 rounded-full bg-[#F0F4F8] border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:border-transparent text-sm transition-shadow"
            aria-label={t('chat.messageInputAria')} />

            {renderClipboardTrigger()}

            <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() && selectedClipboardDocs.length === 0}
            className="w-12 h-12 rounded-full bg-[#0461BA] hover:bg-[#035299] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0 shadow-sm"
            aria-label={t('chat.sendMessageAria')}>
            
              <SendIcon size={20} className="ml-0.5" />
            </button>
          </div>
        </div>
      }
      </div>

      <ClipboardPanel
        isOpen={clipboardPanelOpen}
        onClose={() => setClipboardPanelOpen(false)}
        onSelect={(docs) => {
          setSelectedClipboardDocs((prev) => {
            const next = [...prev];
            docs.forEach((doc) => {
              if (!next.some((existing) => existing.id === doc.id)) {
                next.push(doc);
              }
            });
            return next;
          });
        }}
      />
    </motion.div>);

}

// ---------- Chat history sidebar ----------
interface SidebarProps {
  open: boolean;
  width: number;
  onResizeStart: () => void;
  onToggle: () => void;
  conversations: Conversation[];
  activeId: string | null;
  search: string;
  onSearchChange: (v: string) => void;
  renamingId: string | null;
  renameValue: string;
  menuOpenId: string | null;
  onMenuOpen: (id: string | null) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onStartRename: (id: string, current: string) => void;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
}

function ChatHistorySidebar(p: SidebarProps) {
  const { t } = useLocalization();
  const filtered = p.conversations.filter((c) =>
  c.title.toLowerCase().includes(p.search.toLowerCase())
  );
  const pinned = filtered.filter((c) => c.pinned).sort((a, b) => b.updatedAt - a.updatedAt);
  const recent = filtered.filter((c) => !c.pinned).sort((a, b) => b.updatedAt - a.updatedAt);

  if (!p.open) {
    return (
      <div className="w-10 shrink-0 border-r border-neutral-200 bg-white flex flex-col items-center py-3 gap-2">
        <button
          onClick={p.onToggle}
          title={t('chat.showHistory')}
          className="w-8 h-8 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 flex items-center justify-center">

          <PanelLeftOpenIcon size={16} />
        </button>
        <button
          onClick={p.onNew}
          title={t('chat.newChat')}
          className="w-8 h-8 rounded-md text-neutral-500 hover:text-[#0461BA] hover:bg-[#E8F1FB] flex items-center justify-center">

          <PlusIcon size={16} />
        </button>
      </div>);

  }

  return (
    <aside
      className="shrink-0 border-r border-neutral-200 bg-white flex flex-col relative"
      style={{ width: p.width }}>
      <div className="px-3 py-3 flex items-center gap-2 border-b border-neutral-100">
        <button
          onClick={p.onNew}
          className="flex-1 h-9 px-3 rounded-md bg-[#F0F4F8] text-neutral-700 text-sm font-medium hover:bg-neutral-200 hover:text-neutral-900 inline-flex items-center justify-center gap-1.5 border border-neutral-200 transition-colors">

          <PencilIcon size={14} /> {t('chat.newChat')}
        </button>
        <button
          onClick={p.onToggle}
          title={t('chat.hideHistory')}
          className="w-9 h-9 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 inline-flex items-center justify-center">

          <PanelLeftCloseIcon size={16} />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-neutral-100">
        <div className="relative">
          <SearchIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={p.search}
            onChange={(e) => p.onSearchChange(e.target.value)}
            placeholder={t('chat.searchChats')}
            className="w-full h-8 pl-8 pr-2 rounded-md border border-neutral-200 bg-[#F0F4F8] text-sm focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:bg-white" />

        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {pinned.length > 0 &&
        <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-wide text-neutral-400 font-semibold">{t('chat.pinned')}</div>
        }
        {pinned.map((c) => renderItem(c, p))}
        {recent.length > 0 &&
        <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wide text-neutral-400 font-semibold">{t('chat.recent')}</div>
        }
        {recent.map((c) => renderItem(c, p))}
        {filtered.length === 0 &&
        <div className="px-3 py-6 text-center text-xs text-neutral-400">{t('chat.noChatsFound')}</div>
        }
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={(e) => { e.preventDefault(); p.onResizeStart(); }}
        role="separator"
        aria-orientation="vertical"
        aria-label={t('chat.resizeHistory')}
        title={t('chat.dragToResize')}
        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize group z-10">
        <div className="absolute inset-y-0 right-0 w-px bg-neutral-200 group-hover:bg-[#0461BA] group-active:bg-[#0461BA] transition-colors" />
      </div>
    </aside>);

}

function renderItem(c: Conversation, p: SidebarProps) {
  const { t } = useLocalization();
  const isActive = p.activeId === c.id;
  const isRenaming = p.renamingId === c.id;
  const menuOpen = p.menuOpenId === c.id;
  return (
    <div
      key={c.id}
      className={`group relative mx-2 my-0.5 px-2 py-2 rounded-md cursor-pointer flex items-center gap-2 ${
      isActive ? 'bg-[#E8F1FB] text-[#0461BA]' : 'hover:bg-neutral-200 text-neutral-700'}`
      }
      onClick={() => !isRenaming && p.onSelect(c.id)}>

      <MessageSquareIcon size={14} className="shrink-0 opacity-70" />
      {isRenaming ?
      <input
        autoFocus
        value={p.renameValue}
        onChange={(e) => p.onRenameChange(e.target.value)}
        onBlur={p.onRenameCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') p.onRenameCommit();
          if (e.key === 'Escape') p.onRenameCommit();
        }}
        onClick={(e) => e.stopPropagation()}
        className="flex-1 h-6 px-1 rounded border border-[#0461BA] text-sm bg-white text-neutral-900 focus:outline-none" /> :


      <span className="flex-1 text-sm truncate">{c.title}</span>
      }
      {c.pinned && !isRenaming && <PinIcon size={12} className="text-amber-500 shrink-0" />}
      <button
        onClick={(e) => { e.stopPropagation(); p.onMenuOpen(menuOpen ? null : c.id); }}
        className={`w-6 h-6 rounded shrink-0 inline-flex items-center justify-center ${menuOpen || isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:bg-white`}>

        <MoreHorizontalIcon size={14} />
      </button>
      {menuOpen &&
      <>
          <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); p.onMenuOpen(null); }} />
          <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-1 top-9 z-40 w-40 bg-white rounded-md shadow-lg border border-neutral-200 py-1 text-sm text-neutral-700">

            <button
            onClick={(e) => { e.stopPropagation(); p.onPin(c.id); p.onMenuOpen(null); }}
            className="w-full px-3 py-1.5 text-left hover:bg-[#F0F4F8] flex items-center gap-2">

              {c.pinned ? <><PinOffIcon size={14} /> {t('chat.unpin')}</> : <><PinIcon size={14} /> {t('chat.pin')}</>}
            </button>
            <button
            onClick={(e) => { e.stopPropagation(); p.onStartRename(c.id, c.title); }}
            className="w-full px-3 py-1.5 text-left hover:bg-[#F0F4F8] flex items-center gap-2">

              <PencilIcon size={14} /> {t('chat.rename')}
            </button>
            <button
            onClick={(e) => { e.stopPropagation(); p.onDelete(c.id); }}
            className="w-full px-3 py-1.5 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2">

              <Trash2Icon size={14} /> {t('chat.delete')}
            </button>
          </div>
        </>
      }
    </div>);

}
