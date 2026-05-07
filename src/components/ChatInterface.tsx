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
  Building2Icon,
  Globe2Icon,
  ChevronDownIcon,
  CheckIcon } from
'lucide-react';
import { mockDocuments } from '../data/mockDocuments';
import { statusColors } from './DocumentCard';
import { LeftRail } from './LeftRail';
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
      id: 'c-tag-pv101', title: 'Documents associated with TAG PV-101', pinned: true, scope: projectScope('shard'), updatedAt: now - 2 * 3600000,
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
      id: 'c-latest-pid', title: 'Latest revision of P&ID P-1001-PID-001', pinned: true, scope: projectScope('shard'), updatedAt: now - 5 * 3600000,
      messages: [
      mk('m1', 'user', "What's the latest revision of P-1001-PID-001?", 5 * 3600000),
      mk('m2', 'flint', 'The latest released revision is Rev C (Approved on 28 Apr 2026 by Sarah Chen). Rev D is currently in review with the lead process engineer.', 5 * 3600000 - 90000),
      mk('m3', 'user', 'Show me the change between B and C.', 5 * 3600000 - 10 * 60000),
      mk('m4', 'flint', 'Between Rev B → Rev C: cooling water return line re-routed to header HDR-04, valve XV-3402 added downstream of E-201, line size on 4"-CW-02 increased to 6". Redline PDF available in version history.', 5 * 3600000 - 9 * 60000)]

    },
    {
      id: 'c-pumps-dwg', title: 'Pumps shown on drawing M-3012-GA-006', pinned: false, scope: projectScope('shard'), updatedAt: now - 1 * day,
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
      id: 'c-supersede', title: 'Which drawings supersede DWG-MECH-027-R3?', pinned: false, scope: projectScope('skyline'), updatedAt: now - 1 * day - 4 * 3600000,
      messages: [
      mk('m1', 'user', 'Which drawings supersede DWG-MECH-027-R3?', 1 * day + 4 * 3600000),
      mk('m2', 'flint', 'DWG-MECH-027-R3 has been superseded by DWG-MECH-027-R4 (released 02 May 2026). The R4 revision incorporates the structural support modifications from RFI-2026-118.', 1 * day + 4 * 3600000 - 60000)]

    },
    {
      id: 'c-loop-101', title: 'Loop sheet for instrument FT-205', pinned: false, scope: projectScope('skyline'), updatedAt: now - 2 * day,
      messages: [
      mk('m1', 'user', 'Find the loop sheet for FT-205.', 2 * day),
      mk('m2', 'flint', 'Loop sheet INST-LOOP-205-R2 covers FT-205 (Coriolis flow transmitter on cooling water return). Linked instruments: FY-205, FV-205, FAH-205. Located in /Instrumentation/Loop Sheets.', 2 * day - 60000),
      mk('m3', 'user', 'What is the calibration range?', 2 * day - 20 * 60000),
      mk('m4', 'flint', 'Per loop sheet: 0–1500 kg/h, 4–20 mA, accuracy ±0.5%. Last calibrated 14 Mar 2026.', 2 * day - 19 * 60000)]

    },
    {
      id: 'c-vendor-pump', title: 'Vendor datasheets for centrifugal pump P-204A', pinned: false, scope: ENTERPRISE_SCOPE, updatedAt: now - 2 * day - 5 * 3600000,
      messages: [
      mk('m1', 'user', 'Show vendor datasheets for P-204A.', 2 * day + 5 * 3600000),
      mk('m2', 'flint', 'Two vendor datasheets are linked to P-204A: VEN-DS-003-R1 (Sulzer mechanical) and VEN-DS-016-R1 (motor). Both Approved, current revision.', 2 * day + 5 * 3600000 - 60000)]

    },
    {
      id: 'c-outstanding', title: 'Documents pending review on Substation A', pinned: false, scope: projectScope('tower'), updatedAt: now - 3 * day,
      messages: [
      mk('m1', 'user', 'Any documents pending review on Substation A?', 3 * day),
      mk('m2', 'flint', '3 documents are in review: E-2004-SLD-015 (415V SLD, Rev B), E-2004-PRT-008 (Protection Schematic, Draft), and SPEC-ELEC-022-R1. Reviewer: Daniel Park, due 12 May.', 3 * day - 60000)]

    },
    {
      id: 'c-mech-area01', title: 'All IFC documents for Mechanical Area 01', pinned: false, scope: projectScope('shard'), updatedAt: now - 4 * day,
      messages: [
      mk('m1', 'user', 'List IFC documents for Mechanical Area 01.', 4 * day),
      mk('m2', 'flint', 'Workpack WP-MECH-AREA-01 (Rev C02) contains 42 IFC-status documents across GA, P&IDs, isometrics and civil layouts. Want me to open the package?', 4 * day - 60000)]

    },
    {
      id: 'c-piping-class', title: 'Piping class 150# CS service comparison', pinned: false, scope: ENTERPRISE_SCOPE, updatedAt: now - 5 * day,
      messages: [
      mk('m1', 'user', 'Compare piping class 150# CS for cooling water vs utility air.', 5 * day),
      mk('m2', 'flint', 'Per PIPING-CLASS-150CS-R3: cooling water service uses A106 Gr B SMLS, schedule 40, 1/16" CA. Utility air uses A53 Gr B ERW, schedule 40, no CA. Both are limited to 200°F at 285 psig.', 5 * day - 60000)]

    },
    {
      id: 'c-safety-200', title: 'Confined space procedures for Unit 200', pinned: false, scope: ENTERPRISE_SCOPE, updatedAt: now - 6 * day,
      messages: [
      mk('m1', 'user', 'Summarise confined space procedures for Unit 200.', 6 * day),
      mk('m2', 'flint', 'PROC-SAFE-003-R3 covers Unit 200 confined space entry. Key points: gas test before entry, continuous monitoring, attendant + entry permit, rescue plan ref RES-PLAN-200.', 6 * day - 60000)]

    },
    {
      id: 'c-cable-sched', title: 'Cable schedule for MCC-03 feeders', pinned: false, scope: projectScope('skyline'), updatedAt: now - 7 * day,
      messages: [
      mk('m1', 'user', 'Cable schedule for MCC-03 feeders?', 7 * day),
      mk('m2', 'flint', 'CAB-SCH-MCC03-R2 lists 28 feeders. Largest is FDR-03-12 (P-204A motor, 4-core 95mm² XLPE, 124 m). Schedule last updated 30 Apr 2026.', 7 * day - 60000)]

    },
    {
      id: 'c-where-used', title: 'Where is valve tag XV-3402 referenced?', pinned: false, scope: projectScope('shard'), updatedAt: now - 8 * day,
      messages: [
      mk('m1', 'user', 'Where is XV-3402 referenced?', 8 * day),
      mk('m2', 'flint', 'XV-3402 appears in: P-1001-PID-001 (Rev C), VAL-LIST-AREA01-R5, INST-LOOP-3402-R1, and SPEC-VAL-014-R2. It is also called up in commissioning procedure CMS-PRC-018.', 8 * day - 60000)]

    },
    {
      id: 'c-redline', title: 'Open redlines on Civil Foundations package', pinned: false, scope: projectScope('empire'), updatedAt: now - 9 * day,
      messages: [
      mk('m1', 'user', 'Any open redlines on Civil Foundations?', 9 * day),
      mk('m2', 'flint', 'WP-CIV-FOUND-PKG has 2 open redlines: C-4401-LAY-002 (footing depth comment) and C-4401-LAY-005 (rebar spacing query). Both raised by Marco Rossi.', 9 * day - 60000)]

    },
    {
      id: 'c-transmittals', title: 'Transmittals issued to Contractor X this month', pinned: false, scope: ENTERPRISE_SCOPE, updatedAt: now - 11 * day,
      messages: [
      mk('m1', 'user', 'How many transmittals went to Contractor X this month?', 11 * day),
      mk('m2', 'flint', '7 transmittals to Contractor X in May 2026, totalling 184 documents. 3 are awaiting acknowledgement: TR-2026-118, TR-2026-122, TR-2026-127.', 11 * day - 60000)]

    },
    {
      id: 'c-hold-points', title: 'Hold points on Commissioning Pack 03', pinned: false, scope: projectScope('shard'), updatedAt: now - 14 * day,
      messages: [
      mk('m1', 'user', 'List the hold points on Commissioning Pack 03.', 14 * day),
      mk('m2', 'flint', 'CMS-PCK-03 has 4 hold points: H1 hydrotest sign-off, H2 NDT acceptance, H3 instrument loop check, H4 client witnessed run-in. H1 and H2 cleared; H3 in progress.', 14 * day - 60000)]

    }];

  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [scope, setScope] = useState<ChatScope>(() => {
    if (typeof window === 'undefined') return ENTERPRISE_SCOPE;
    const saved = localStorage.getItem('flux.currentProject');
    const match = PROJECTS.find((p) => p.name === saved);
    return match ? { kind: 'project', id: match.id, name: match.name } : ENTERPRISE_SCOPE;
  });
  const askAboutRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (askAbout && askAbout !== askAboutRef.current) {
      askAboutRef.current = askAbout;
      setActiveId(null);
      setInputValue('');
      const saved = typeof window !== 'undefined' ? localStorage.getItem('flux.currentProject') : null;
      const match = PROJECTS.find((p) => p.name === saved);
      if (match) setScope({ kind: 'project', id: match.id, name: match.name });
    }
  }, [askAbout]);
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const scopedConversations = conversations.filter((c) => scopesEqual(c.scope, scope));
  const handleScopeChange = (next: ChatScope) => {
    setScope(next);
    setScopeMenuOpen(false);
    setActiveId((prev) => {
      if (!prev) return null;
      const found = conversations.find((c) => c.id === prev);
      return found && scopesEqual(found.scope, next) ? prev : null;
    });
  };
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
        list = [{ id, title: 'New chat', pinned: false, scope, updatedAt: Date.now(), messages: [] }, ...prev];
        setActiveId(id);
      }
      return list.map((c) =>
      c.id === id ? { ...c, messages: updater(c.messages), updatedAt: Date.now() } : c
      );
    });
  };
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  const buildResponseForQuery = (query: string): React.ReactNode => {
    const lowerQuery = query.toLowerCase();
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
            Based on the project documents, here are the relevant
            specifications:
          </p>
          <div className="space-y-2 mb-3">
            {docs.map((doc) =>
            <button
              key={doc.id}
              onClick={() => onDocumentSelect(doc.id)}
              className="w-full flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 hover:border-[#0461BA]/30 transition-colors group text-left">
              
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
            Click any document above to view it in the document grid.
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
            Here are the relevant mechanical drawings for piping and material
            standards:
          </p>
          <div className="space-y-2 mb-3">
            {docs.map((doc) =>
            <button
              key={doc.id}
              onClick={() => onDocumentSelect(doc.id)}
              className="w-full flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 hover:border-[#0461BA]/30 transition-colors group text-left">
              
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
            Click any document above to view it in the document grid.
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
            Here are the relevant safety procedures for your query:
          </p>
          <div className="space-y-2 mb-3">
            {docs.map((doc) =>
            <button
              key={doc.id}
              onClick={() => onDocumentSelect(doc.id)}
              className="w-full flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 hover:border-[#0461BA]/30 transition-colors group text-left">
              
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
            Click any document above to view it in the document grid.
          </p>
        </div>);

    }
    // Default fallback with random documents
    const docs = mockDocuments.slice(0, 3);
    return (
      <div>
        <p className="mb-3">
          Here are some relevant documents I found related to your query:
        </p>
        <div className="space-y-2 mb-3">
          {docs.map((doc) =>
          <button
            key={doc.id}
            onClick={() => onDocumentSelect(doc.id)}
            className="w-full flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 hover:border-[#0461BA]/30 transition-colors group text-left">
            
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
          Click any document above to view it in the document grid.
        </p>
      </div>);

  };
  const handleSend = (overrideValue?: string) => {
    const text = overrideValue || inputValue;
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      content: text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    // Auto-title from first user message
    setConversations((prev) => {
      let id = activeId;
      let list = prev;
      if (!id) {
        id = 'c-' + Date.now();
        list = [{ id, title: text.slice(0, 40), pinned: false, scope, updatedAt: Date.now(), messages: [] }, ...prev];
        setActiveId(id);
      }
      return list.map((c) => {
        if (c.id !== id) return c;
        const isFirstUser = !c.messages.some((m) => m.sender === 'user');
        return {
          ...c,
          title: isFirstUser ? text.slice(0, 40) : c.title,
          messages: [...c.messages, userMsg],
          updatedAt: Date.now()
        };
      });
    });
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const flintMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: buildResponseForQuery(text),
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
    const subject = askKind === 'folder' ? `the ${askAbout} folder` : askKind === 'document' ? `the ${askAbout} document` : askAbout;
    return [
    `Summarise ${subject}`,
    `Who is responsible for ${subject}?`,
    `What is the latest activity on ${subject}?`,
    `Are there any open issues or holds on ${subject}?`,
    `Show recent changes to ${subject}`];
  })() :

  [
  'What documents are associated with TAG PV-101?',
  'Show the latest revision of P-1001-PID-001',
  'List pumps shown on drawing M-3012-GA-006',
  'Where is valve tag XV-3402 referenced?',
  'Vendor datasheets for centrifugal pump P-204A'];

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
      className="fixed inset-x-0 top-6 bottom-0 bg-[#F8FAFC] z-30 flex pl-14">

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
        scope={scope}
        scopeMenuOpen={scopeMenuOpen}
        onScopeMenuToggle={() => setScopeMenuOpen((v) => !v)}
        onScopeChange={handleScopeChange}
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
      {/* Scope banner */}
      <div className="h-11 shrink-0 border-b border-neutral-100 px-4 flex items-center bg-white">
        <div
          className={`w-full h-8 px-3 rounded-md border inline-flex items-center gap-2 text-xs font-medium ${scope.kind === 'enterprise' ? 'border-violet-200 bg-violet-50 text-violet-900' : 'border-[#0461BA]/30 bg-[#E8F1FB] text-[#0461BA]'}`}
          role="status"
          aria-live="polite">
          {scope.kind === 'enterprise' ?
          <>
            <Globe2Icon size={14} className="shrink-0" />
            <span className="font-semibold uppercase tracking-wide">Enterprise chat</span>
            <span className="text-violet-700/80 font-normal">— responses span every project you have access to</span>
          </> :
          <>
            <Building2Icon size={14} className="shrink-0" />
            <span className="font-semibold uppercase tracking-wide">Project chat</span>
            <span className="text-[#0461BA]/80 font-normal">— scoped to <span className="font-semibold">{scope.name}</span></span>
          </>
          }
        </div>
      </div>
      {/* Messages Area / Empty State */}
      <div
        className="flex-1 overflow-y-auto flex flex-col"
        role="log"
        aria-live="polite"
        aria-label="Chat messages">
        
        {messages.length === 0 ?
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full">
            <div className="w-16 h-16 bg-[#E8F1FB] rounded-full flex items-center justify-center mb-4 shadow-sm">
              <SparklesIcon size={32} className="text-[#0461BA]" />
            </div>
            {askAbout ?
          <>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2 text-center">
                What do you want to ask Flint about {askKind === 'folder' ? 'the ' : ''}<span className="text-[#0461BA]">{askAbout}</span>{askKind === 'folder' ? ' folder' : askKind === 'document' ? ' document' : ''}?
              </h2>
              <p className="text-neutral-500 mb-6 text-center text-base">
                Type a question below or pick a suggestion.
              </p>
            </> :
          <>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                Ask Flint
              </h2>
              <p className="text-neutral-500 mb-6 text-center text-lg">
                Your AI engineering assistant. Ask about document specifications,
                project details, or compliance requirements.
              </p>
            </>
          }

            {/* Centered Input for Empty State */}
            <div className="w-full relative shadow-sm rounded-full bg-white border border-neutral-200 focus-within:ring-2 focus-within:ring-[#0461BA] focus-within:border-transparent transition-all">
              <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="E.g., What is the required tensile strength for the primary support beams?"
              className="w-full pl-6 pr-16 py-4 rounded-full bg-transparent text-neutral-900 placeholder-neutral-400 focus:outline-none text-base"
              autoFocus />
            
              <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0461BA] hover:bg-[#035299] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors">
              
                <SendIcon size={18} className="ml-0.5" />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) =>
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="px-4 py-2 bg-white border border-neutral-200 rounded-full text-sm text-neutral-600 hover:bg-neutral-50 hover:text-[#0461BA] transition-colors">
              
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
                      <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">
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
                          Flint AI
                        </p>
                    }
                      <div className="text-[15px] leading-relaxed">
                        {message.content}
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
          <div className="max-w-[960px] mx-auto flex items-center gap-3">
            <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up question..."
            className="flex-1 px-5 py-3.5 rounded-full bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:border-transparent text-sm transition-shadow"
            aria-label="Message input" />
          
            <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim()}
            className="w-12 h-12 rounded-full bg-[#0461BA] hover:bg-[#035299] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0 shadow-sm"
            aria-label="Send message">
            
              <SendIcon size={20} className="ml-0.5" />
            </button>
          </div>
        </div>
      }
      </div>
    </motion.div>);

}

// ---------- Chat history sidebar ----------
interface SidebarProps {
  open: boolean;
  width: number;
  onResizeStart: () => void;
  onToggle: () => void;
  conversations: Conversation[];
  scope: ChatScope;
  scopeMenuOpen: boolean;
  onScopeMenuToggle: () => void;
  onScopeChange: (s: ChatScope) => void;
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
          title="Show chat history"
          className="w-8 h-8 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 flex items-center justify-center">

          <PanelLeftOpenIcon size={16} />
        </button>
        <button
          onClick={p.onNew}
          title="New chat"
          className="w-8 h-8 rounded-md text-neutral-500 hover:text-[#0461BA] hover:bg-[#E8F1FB] flex items-center justify-center">

          <PlusIcon size={16} />
        </button>
      </div>);

  }

  return (
    <aside
      className="shrink-0 border-r border-neutral-200 bg-white flex flex-col relative"
      style={{ width: p.width }}>
      {/* Scope switcher */}
      <div className="h-11 shrink-0 px-3 flex items-center border-b border-neutral-100 relative">
        <button
          onClick={p.onScopeMenuToggle}
          aria-haspopup="listbox"
          aria-expanded={p.scopeMenuOpen}
          className={`w-full h-8 px-2.5 rounded-md border inline-flex items-center gap-2 text-sm font-medium transition-colors ${p.scope.kind === 'enterprise' ? 'border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100' : 'border-[#0461BA]/30 bg-[#E8F1FB] text-[#0461BA] hover:bg-[#d6e7f8]'}`}>
          {p.scope.kind === 'enterprise' ?
          <Globe2Icon size={14} className="shrink-0" /> :
          <Building2Icon size={14} className="shrink-0" />
          }
          <span className="flex-1 text-left truncate">
            {p.scope.kind === 'enterprise' ? 'Enterprise chat' : p.scope.name}
          </span>
          <ChevronDownIcon size={14} className={`shrink-0 transition-transform ${p.scopeMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        {p.scopeMenuOpen &&
        <div
          role="listbox"
          className="absolute left-3 right-3 top-full mt-1 z-20 bg-white border border-neutral-200 rounded-md shadow-lg overflow-hidden">
            <button
            onClick={() => p.onScopeChange({ kind: 'enterprise' })}
            role="option"
            aria-selected={p.scope.kind === 'enterprise'}
            className="w-full px-3 py-2 inline-flex items-center gap-2 text-sm hover:bg-violet-50 text-left">
              <Globe2Icon size={14} className="text-violet-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-neutral-900">Enterprise chat</div>
                <div className="text-[11px] text-neutral-500 truncate">All projects you can access</div>
              </div>
              {p.scope.kind === 'enterprise' && <CheckIcon size={14} className="text-violet-600 shrink-0" />}
            </button>
            <div className="border-t border-neutral-100 px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-neutral-400 font-semibold">Projects</div>
            {PROJECTS.map((proj) => {
            const selected = p.scope.kind === 'project' && p.scope.id === proj.id;
            return (
              <button
                key={proj.id}
                onClick={() => p.onScopeChange({ kind: 'project', id: proj.id, name: proj.name })}
                role="option"
                aria-selected={selected}
                className="w-full px-3 py-2 inline-flex items-center gap-2 text-sm hover:bg-[#E8F1FB] text-left">
                <Building2Icon size={14} className="text-[#0461BA] shrink-0" />
                <span className="flex-1 truncate text-neutral-900">{proj.name}</span>
                {selected && <CheckIcon size={14} className="text-[#0461BA] shrink-0" />}
              </button>);
          })}
          </div>
        }
      </div>

      <div className="px-3 py-3 flex items-center gap-2 border-b border-neutral-100">
        <button
          onClick={p.onNew}
          className="flex-1 h-9 px-3 rounded-md bg-[#0461BA] text-white text-sm font-medium hover:bg-[#035299] inline-flex items-center justify-center gap-1.5">

          <PlusIcon size={14} /> New chat
        </button>
        <button
          onClick={p.onToggle}
          title="Hide chat history"
          className="w-9 h-9 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 inline-flex items-center justify-center">

          <PanelLeftCloseIcon size={16} />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-neutral-100">
        <div className="relative">
          <SearchIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={p.search}
            onChange={(e) => p.onSearchChange(e.target.value)}
            placeholder="Search chats"
            className="w-full h-8 pl-8 pr-2 rounded-md border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:bg-white" />

        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {pinned.length > 0 &&
        <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-wide text-neutral-400 font-semibold">Pinned</div>
        }
        {pinned.map((c) => renderItem(c, p))}
        {recent.length > 0 &&
        <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wide text-neutral-400 font-semibold">Recent</div>
        }
        {recent.map((c) => renderItem(c, p))}
        {filtered.length === 0 &&
        <div className="px-3 py-6 text-center text-xs text-neutral-400">No chats found</div>
        }
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={(e) => { e.preventDefault(); p.onResizeStart(); }}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize chat history"
        title="Drag to resize"
        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize group z-10">
        <div className="absolute inset-y-0 right-0 w-px bg-neutral-200 group-hover:bg-[#0461BA] group-active:bg-[#0461BA] transition-colors" />
      </div>
    </aside>);

}

function renderItem(c: Conversation, p: SidebarProps) {
  const isActive = p.activeId === c.id;
  const isRenaming = p.renamingId === c.id;
  const menuOpen = p.menuOpenId === c.id;
  return (
    <div
      key={c.id}
      className={`group relative mx-2 my-0.5 px-2 py-2 rounded-md cursor-pointer flex items-center gap-2 ${
      isActive ? 'bg-[#E8F1FB] text-[#0461BA]' : 'hover:bg-neutral-100 text-neutral-700'}`
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
            className="w-full px-3 py-1.5 text-left hover:bg-neutral-50 flex items-center gap-2">

              {c.pinned ? <><PinOffIcon size={14} /> Unpin</> : <><PinIcon size={14} /> Pin</>}
            </button>
            <button
            onClick={(e) => { e.stopPropagation(); p.onStartRename(c.id, c.title); }}
            className="w-full px-3 py-1.5 text-left hover:bg-neutral-50 flex items-center gap-2">

              <PencilIcon size={14} /> Rename
            </button>
            <button
            onClick={(e) => { e.stopPropagation(); p.onDelete(c.id); }}
            className="w-full px-3 py-1.5 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2">

              <Trash2Icon size={14} /> Delete
            </button>
          </div>
        </>
      }
    </div>);

}