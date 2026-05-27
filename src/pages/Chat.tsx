import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  SendIcon,
  XIcon,
  SparklesIcon,
  FileTextIcon,
  PlusIcon,
  StarIcon,
  PencilIcon,
  Trash2Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  MoreHorizontalIcon,
  MessageSquareIcon,
  SearchIcon,
  GripVerticalIcon,
  FileIcon } from
'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockDocuments } from '../data/mockDocuments';
import { statusColors } from '../components/documentStatusColors';
import { LeftRail } from '../components/LeftRail';
import { ClipboardDropdown } from '../components/ClipboardDropdown';
import { useClipboard } from '../contexts/ClipboardContext';
import { useScope } from '../contexts/ScopeContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { Document } from '../types/document';
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
  favourited: boolean;
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
export function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const askAbout = searchParams.get('ask');
const onExit = () => navigate('/');
  const onDocumentSelect = (_docId: string) => navigate('/documents');
  const { t } = useLocalization();
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const day = 86400000;
    const now = Date.now();
    const fmt = (offset: number) =>
      new Date(now - offset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mk = (id: string, sender: 'user' | 'flint', content: React.ReactNode, offset: number): ChatMessage => ({
      id, sender, content, timestamp: fmt(offset)
    });

    return [
    {
      id: 'c-tag-pv101', title: 'Documents for TAG PV-101', favourited: true, scope: projectScope('shard'), updatedAt: now - 2 * 3600000,
      messages: [
      mk('m1', 'user', 'What documents are associated with TAG PV-101?', 2 * 3600000),
      mk('m2', 'flint',
      <div>
            <p className="mb-2">PV-101 (Knock-out Drum) is referenced in 6 controlled documents:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>P-1001-PID-001 — Cooling Water Loop P&amp;ID (Rev C)</li>
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
      id: 'c-latest-pid', title: 'Latest revision of P-1001-PID-001', favourited: true, scope: projectScope('shard'), updatedAt: now - 5 * 3600000,
      messages: [
      mk('m1', 'user', "What's the latest revision of P-1001-PID-001?", 5 * 3600000),
      mk('m2', 'flint', 'The latest released revision is Rev C (Approved on 28 Apr 2026 by Sarah Chen). Rev D is currently in review with the lead process engineer.', 5 * 3600000 - 90000),
      mk('m3', 'user', 'Show me the changes between Rev B and C.', 5 * 3600000 - 10 * 60000),
      mk('m4', 'flint', 'Between Rev B → Rev C: cooling water return line re-routed to header HDR-04, valve XV-3402 added downstream of E-201, line size on 4″-CW-02 increased to 6″. Redline PDF available in version history.', 5 * 3600000 - 9 * 60000)]
    },
    {
      id: 'c-approval-spec', title: 'Approval status — SPEC-PROC-042', favourited: false, scope: projectScope('tower'), updatedAt: now - 3 * 3600000,
      messages: [
      mk('m1', 'user', 'What is the current approval status of SPEC-PROC-042?', 3 * 3600000),
      mk('m2', 'flint',
      <div>
            <p className="mb-2">SPEC-PROC-042 (Bolting and Torquing Procedure, Rev B) is currently <strong>In Review</strong>.</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Submitted for review: 08 May 2026</li>
              <li>Reviewer 1: James Okafor — <span className="text-green-600 font-medium">Approved</span> (10 May)</li>
              <li>Reviewer 2: Sarah Chen — <span className="text-amber-600 font-medium">Pending</span> (due 15 May)</li>
              <li>Final approver: David Walsh — awaiting reviewer sign-off</li>
            </ul>
          </div>, 3 * 3600000 - 60000),
      mk('m3', 'user', 'Can you send a reminder to Sarah?', 3 * 3600000 - 8 * 60000),
      mk('m4', 'flint', 'I can draft a reminder notification, but sending requires your confirmation — review actions are logged against your user account. Shall I proceed?', 3 * 3600000 - 7 * 60000)]
    },
    {
      id: 'c-rfi-118', title: 'RFI-2026-118 and linked documents', favourited: false, scope: projectScope('skyline'), updatedAt: now - 6 * 3600000,
      messages: [
      mk('m1', 'user', 'Show me the details and linked documents for RFI-2026-118.', 6 * 3600000),
      mk('m2', 'flint',
      <div>
            <p className="mb-2"><strong>RFI-2026-118</strong> — Structural support bracket modification, Grid J4</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Raised by: Marco Rossi, 28 Apr 2026</li>
              <li>Status: <span className="text-green-600 font-medium">Closed</span> — Response issued 05 May 2026</li>
              <li>Response: Support bracket to be relocated 150 mm north per SK-STR-118-R1</li>
            </ul>
            <p className="mt-2 text-sm font-medium">Linked documents:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>DWG-MECH-027-R3 → superseded by R4 (incorporates RFI response)</li>
              <li>SK-STR-118-R1 — Sketch issued with RFI response</li>
              <li>CALC-STR-042-R2 — Updated structural calc</li>
            </ul>
          </div>, 6 * 3600000 - 60000)]
    },
    {
      id: 'c-pumps-dwg', title: 'Pumps on drawing M-3012-GA-006', favourited: false, scope: projectScope('shard'), updatedAt: now - 1 * day,
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
      id: 'c-change-request', title: 'CR-2026-045 impact assessment', favourited: false, scope: projectScope('tower'), updatedAt: now - 1 * day - 2 * 3600000,
      messages: [
      mk('m1', 'user', 'What documents are affected by change request CR-2026-045?', 1 * day + 2 * 3600000),
      mk('m2', 'flint',
      <div>
            <p className="mb-2"><strong>CR-2026-045</strong> — Substation A busbar rating increase from 1600A to 2000A.</p>
            <p className="mb-2 text-sm">Impact assessment identifies <strong>9 documents</strong> requiring revision:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>E-2004-SLD-015 — 415V Single Line Diagram (current Rev B)</li>
              <li>E-2004-PRT-008 — Protection Schematic</li>
              <li>SPEC-ELEC-022-R1 — HV Switchgear Specification</li>
              <li>CALC-ELEC-017-R3 — Load Schedule</li>
              <li>VEN-DS-041-R1 — Switchgear Vendor Datasheet</li>
              <li>+4 additional installation drawings</li>
            </ul>
            <p className="mt-2 text-sm">Estimated revision cycle: 3 weeks. No IFC documents are affected.</p>
          </div>, 1 * day + 2 * 3600000 - 60000),
      mk('m3', 'user', 'Who is the document controller for this change?', 1 * day + 2 * 3600000 - 15 * 60000),
      mk('m4', 'flint', 'Document controller assigned to CR-2026-045 is Daniel Park. He can be reached via the Team directory or by initiating a workflow action from the Change Request record.', 1 * day + 2 * 3600000 - 14 * 60000)]
    },
    {
      id: 'c-supersede', title: 'Drawings superseding DWG-MECH-027-R3', favourited: false, scope: projectScope('skyline'), updatedAt: now - 1 * day - 4 * 3600000,
      messages: [
      mk('m1', 'user', 'Which drawings supersede DWG-MECH-027-R3?', 1 * day + 4 * 3600000),
      mk('m2', 'flint', 'DWG-MECH-027-R3 has been superseded by DWG-MECH-027-R4 (released 02 May 2026). The R4 revision incorporates the structural support modifications from RFI-2026-118.', 1 * day + 4 * 3600000 - 60000)]
    },
    {
      id: 'c-instrument-pt301', title: 'Datasheet for PT-301', favourited: false, scope: projectScope('empire'), updatedAt: now - 1 * day - 6 * 3600000,
      messages: [
      mk('m1', 'user', 'Find the instrument datasheet for PT-301.', 1 * day + 6 * 3600000),
      mk('m2', 'flint',
      <div>
            <p className="mb-2"><strong>PT-301</strong> — Pressure transmitter, high-pressure gas header.</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Datasheet: INST-DS-PT301-R2 (Approved, 15 Mar 2026)</li>
              <li>Manufacturer: Emerson Rosemount 3051</li>
              <li>Range: 0–100 barg, 4–20 mA HART</li>
              <li>Process connection: ½″ NPT, 316SS</li>
              <li>Hazardous area classification: Zone 1, ATEX II 2G Ex ia IIC T4</li>
            </ul>
            <p className="mt-2 text-sm">Loop sheet: INST-LOOP-301-R1. Located in <code>/Instrumentation/Datasheets/Pressure</code>.</p>
          </div>, 1 * day + 6 * 3600000 - 60000)]
    },
    {
      id: 'c-loop-101', title: 'Loop sheet for FT-205', favourited: false, scope: projectScope('skyline'), updatedAt: now - 2 * day,
      messages: [
      mk('m1', 'user', 'Find the loop sheet for FT-205.', 2 * day),
      mk('m2', 'flint', 'Loop sheet INST-LOOP-205-R2 covers FT-205 (Coriolis flow transmitter on cooling water return). Linked instruments: FY-205, FV-205, FAH-205. Located in /Instrumentation/Loop Sheets.', 2 * day - 60000),
      mk('m3', 'user', 'What is the calibration range?', 2 * day - 20 * 60000),
      mk('m4', 'flint', 'Per loop sheet: 0–1500 kg/h, 4–20 mA, accuracy ±0.5%. Last calibrated 14 Mar 2026.', 2 * day - 19 * 60000)]
    },
    {
      id: 'c-vendor-pump', title: 'Vendor datasheets for P-204A', favourited: false, scope: ENTERPRISE_SCOPE, updatedAt: now - 2 * day - 5 * 3600000,
      messages: [
      mk('m1', 'user', 'Show vendor datasheets for P-204A.', 2 * day + 5 * 3600000),
      mk('m2', 'flint', 'Two vendor datasheets are linked to P-204A: VEN-DS-003-R1 (Sulzer mechanical) and VEN-DS-016-R1 (motor). Both Approved, current revision.', 2 * day + 5 * 3600000 - 60000)]
    },
    {
      id: 'c-outstanding', title: 'Documents pending review — Substation A', favourited: false, scope: projectScope('tower'), updatedAt: now - 3 * day,
      messages: [
      mk('m1', 'user', 'Any documents pending review on Substation A?', 3 * day),
      mk('m2', 'flint', '3 documents are in review: E-2004-SLD-015 (415V SLD, Rev B), E-2004-PRT-008 (Protection Schematic, Draft), and SPEC-ELEC-022-R1. Reviewer: Daniel Park, due 12 May.', 3 * day - 60000)]
    },
    {
      id: 'c-weld-records', title: 'Weld records — ISO-PIPE-CW-023', favourited: false, scope: projectScope('shard'), updatedAt: now - 3 * day - 3 * 3600000,
      messages: [
      mk('m1', 'user', 'Pull up the weld records for spool ISO-PIPE-CW-023.', 3 * day + 3 * 3600000),
      mk('m2', 'flint',
      <div>
            <p className="mb-2"><strong>ISO-PIPE-CW-023</strong> — Cooling water spool, 6″ SCH40 A106 Gr B.</p>
            <p className="mb-1 text-sm font-medium">Weld records (WPS-CW-004-R2):</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Weld W-023-01 — Butt weld, welder cert WQT-014, RT accepted 02 May 2026</li>
              <li>Weld W-023-02 — Butt weld, welder cert WQT-014, RT accepted 02 May 2026</li>
              <li>Weld W-023-03 — Branch weld, welder cert WQT-022, UT pending</li>
            </ul>
            <p className="mt-2 text-sm text-amber-700">⚠ W-023-03 NDE not yet complete. Spool cannot be released until UT sign-off.</p>
          </div>, 3 * day + 3 * 3600000 - 60000),
      mk('m3', 'user', 'Who is the responsible NDE contractor?', 3 * day + 3 * 3600000 - 12 * 60000),
      mk('m4', 'flint', 'NDE contractor is Applus RTD. Their current site supervisor is listed as Kevin White in the QA register. Last site attendance was 09 May 2026.', 3 * day + 3 * 3600000 - 11 * 60000)]
    },
    {
      id: 'c-mech-area01', title: 'IFC documents — Mechanical Area 01', favourited: false, scope: projectScope('shard'), updatedAt: now - 4 * day,
      messages: [
      mk('m1', 'user', 'List IFC documents for Mechanical Area 01.', 4 * day),
      mk('m2', 'flint', 'Workpack WP-MECH-AREA-01 (Rev C02) contains 42 IFC-status documents across GA, P&IDs, isometrics and civil layouts. Want me to open the package?', 4 * day - 60000)]
    },
    {
      id: 'c-vendor-doc-reg', title: 'Vendor document register — HX Package', favourited: false, scope: projectScope('skyline'), updatedAt: now - 4 * day - 4 * 3600000,
      messages: [
      mk('m1', 'user', 'What is the status of the vendor document register for the heat exchanger package?', 4 * day + 4 * 3600000),
      mk('m2', 'flint',
      <div>
            <p className="mb-2"><strong>VDR-HX-PKG-003</strong> — Shell & Tube Heat Exchanger, E-201 (Vendor: Alfa Laval)</p>
            <p className="mb-1 text-sm">18 vendor documents required. Current status:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li><span className="text-green-600 font-medium">Approved:</span> 11 documents</li>
              <li><span className="text-amber-600 font-medium">Under review:</span> 4 documents</li>
              <li><span className="text-red-600 font-medium">Overdue:</span> 2 documents (VEN-DS-003-R2, VEN-GA-003-R1 — 14 days late)</li>
              <li><span className="text-neutral-500">Not yet submitted:</span> 1 document</li>
            </ul>
            <p className="mt-2 text-sm">Next milestone: Fabrication drawings approval required before 25 May 2026.</p>
          </div>, 4 * day + 4 * 3600000 - 60000),
      mk('m3', 'user', 'Chase the overdue documents.', 4 * day + 4 * 3600000 - 10 * 60000),
      mk('m4', 'flint', 'I can generate a formal overdue notice to Alfa Laval referencing contract clause 14.3. It will copy the project engineer and document controller. Confirm to proceed, or I can draft it for your review first.', 4 * day + 4 * 3600000 - 9 * 60000)]
    },
    {
      id: 'c-piping-class', title: 'Piping class comparison — 150# CS', favourited: false, scope: ENTERPRISE_SCOPE, updatedAt: now - 5 * day,
      messages: [
      mk('m1', 'user', 'Compare piping class 150# CS for cooling water vs utility air.', 5 * day),
      mk('m2', 'flint', 'Per PIPING-CLASS-150CS-R3: cooling water service uses A106 Gr B SMLS, schedule 40, 1/16″ CA. Utility air uses A53 Gr B ERW, schedule 40, no CA. Both are limited to 200°F at 285 psig.', 5 * day - 60000)]
    },
    {
      id: 'c-safety-200', title: 'Confined space procedures — Unit 200', favourited: false, scope: ENTERPRISE_SCOPE, updatedAt: now - 6 * day,
      messages: [
      mk('m1', 'user', 'Summarise confined space procedures for Unit 200.', 6 * day),
      mk('m2', 'flint', 'PROC-SAFE-003-R3 covers Unit 200 confined space entry. Key points: gas test before entry, continuous monitoring, attendant + entry permit, rescue plan ref RES-PLAN-200.', 6 * day - 60000)]
    },
    {
      id: 'c-ncr-civil', title: 'NCR status — civil works Grid J', favourited: false, scope: projectScope('shard'), updatedAt: now - 6 * day - 4 * 3600000,
      messages: [
      mk('m1', 'user', 'Are there any open NCRs for civil works on Grid J?', 6 * day + 4 * 3600000),
      mk('m2', 'flint',
      <div>
            <p className="mb-2">2 open non-conformance reports for civil works on Grid J:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li><strong>NCR-2026-031</strong> — Footing C-J4 poured outside tolerance (±15 mm vs ±10 mm spec). Disposition: rework. Awaiting sign-off from civil lead.</li>
              <li><strong>NCR-2026-038</strong> — Rebar cover insufficient on column base plate J6. Under review by structural engineer. Due 18 May.</li>
            </ul>
            <p className="mt-2 text-sm">Both NCRs are linked to drawing C-4401-LAY-002. QA register updated 10 May 2026.</p>
          </div>, 6 * day + 4 * 3600000 - 60000)]
    },
    {
      id: 'c-cable-sched', title: 'Cable schedule — MCC-03 feeders', favourited: false, scope: projectScope('skyline'), updatedAt: now - 7 * day,
      messages: [
      mk('m1', 'user', 'Cable schedule for MCC-03 feeders?', 7 * day),
      mk('m2', 'flint', 'CAB-SCH-MCC03-R2 lists 28 feeders. Largest is FDR-03-12 (P-204A motor, 4-core 95mm² XLPE, 124 m). Schedule last updated 30 Apr 2026.', 7 * day - 60000)]
    },
    {
      id: 'c-asbuilt-pkg07', title: 'As-built status — Package 07', favourited: false, scope: projectScope('empire'), updatedAt: now - 7 * day - 5 * 3600000,
      messages: [
      mk('m1', 'user', 'What is the as-built drawing status for Package 07?', 7 * day + 5 * 3600000),
      mk('m2', 'flint',
      <div>
            <p className="mb-2"><strong>Package 07</strong> — Condensate Recovery System. 31 drawings in scope.</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li><span className="text-green-600 font-medium">As-built issued:</span> 22 drawings</li>
              <li><span className="text-amber-600 font-medium">Redlines received, not yet drafted:</span> 6 drawings</li>
              <li><span className="text-red-600 font-medium">Redlines not yet received from site:</span> 3 drawings</li>
            </ul>
            <p className="mt-2 text-sm">Target for full as-built issue: 31 May 2026. At current rate, 3 drawings are at risk.</p>
          </div>, 7 * day + 5 * 3600000 - 60000),
      mk('m3', 'user', 'Which 3 drawings are at risk?', 7 * day + 5 * 3600000 - 8 * 60000),
      mk('m4', 'flint', 'At risk: C-7003-ISO-014 (spool not yet inspected), C-7003-ISO-019 (site supervisor on leave until 20 May), and P-7001-PID-003 (outstanding P&ID markup from commissioning team).', 7 * day + 5 * 3600000 - 7 * 60000)]
    },
    {
      id: 'c-where-used', title: 'Where is XV-3402 referenced?', favourited: false, scope: projectScope('shard'), updatedAt: now - 8 * day,
      messages: [
      mk('m1', 'user', 'Where is XV-3402 referenced?', 8 * day),
      mk('m2', 'flint', 'XV-3402 appears in: P-1001-PID-001 (Rev C), VAL-LIST-AREA01-R5, INST-LOOP-3402-R1, and SPEC-VAL-014-R2. It is also called up in commissioning procedure CMS-PRC-018.', 8 * day - 60000)]
    },
    {
      id: 'c-hazop', title: 'Open HAZOP action items', favourited: false, scope: ENTERPRISE_SCOPE, updatedAt: now - 8 * day - 3 * 3600000,
      messages: [
      mk('m1', 'user', 'How many HAZOP action items are still open across all projects?', 8 * day + 3 * 3600000),
      mk('m2', 'flint',
      <div>
            <p className="mb-2">Across all projects, <strong>14 HAZOP actions</strong> remain open (from 3 studies):</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li><strong>The Shard:</strong> 6 open — 2 overdue, 4 in progress. Study: HAZOP-SHARD-2025-R1</li>
              <li><strong>Skyline:</strong> 5 open — all in progress. Study: HAZOP-SKY-2026-R1</li>
              <li><strong>Tower:</strong> 3 open — 1 overdue. Study: HAZOP-TWR-2025-R2</li>
            </ul>
            <p className="mt-2 text-sm">3 overdue actions require escalation. Responsible engineers: Sarah Chen (2), Marco Rossi (1).</p>
          </div>, 8 * day + 3 * 3600000 - 60000)]
    },
    {
      id: 'c-redline', title: 'Open redlines — Civil Foundations', favourited: false, scope: projectScope('empire'), updatedAt: now - 9 * day,
      messages: [
      mk('m1', 'user', 'Any open redlines on Civil Foundations?', 9 * day),
      mk('m2', 'flint', 'WP-CIV-FOUND-PKG has 2 open redlines: C-4401-LAY-002 (footing depth comment) and C-4401-LAY-005 (rebar spacing query). Both raised by Marco Rossi.', 9 * day - 60000)]
    },
    {
      id: 'c-transmittals', title: 'Transmittals to Contractor X — May 2026', favourited: false, scope: ENTERPRISE_SCOPE, updatedAt: now - 11 * day,
      messages: [
      mk('m1', 'user', 'How many transmittals went to Contractor X this month?', 11 * day),
      mk('m2', 'flint', '7 transmittals to Contractor X in May 2026, totalling 184 documents. 3 are awaiting acknowledgement: TR-2026-118, TR-2026-122, TR-2026-127.', 11 * day - 60000)]
    },
    {
      id: 'c-doc-by-author', title: "Sarah Chen's documents in review", favourited: false, scope: projectScope('shard'), updatedAt: now - 12 * day,
      messages: [
      mk('m1', 'user', "List all documents currently assigned to Sarah Chen for review.", 12 * day),
      mk('m2', 'flint',
      <div>
            <p className="mb-2"><strong>Sarah Chen</strong> has 5 documents assigned for review:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>P-1001-PID-001 Rev D — Due 14 May 2026 <span className="text-red-600 font-medium">(overdue)</span></li>
              <li>SPEC-PROC-042 Rev B — Due 15 May 2026</li>
              <li>CALC-PROC-017-R4 — Due 16 May 2026</li>
              <li>M-3014-GA-002 Rev C — Due 20 May 2026</li>
              <li>RPT-HSE-015-R1 — Due 22 May 2026</li>
            </ul>
          </div>, 12 * day - 60000),
      mk('m3', 'user', 'Flag the overdue one to her manager.', 12 * day - 18 * 60000),
      mk('m4', 'flint', "P-1001-PID-001 Rev D is 6 days overdue. Sarah Chen's manager is listed as David Walsh (Lead Process Engineer). I can raise a workflow escalation — this will be recorded in the document audit trail. Confirm?", 12 * day - 17 * 60000)]
    },
    {
      id: 'c-hold-points', title: 'Hold points — Commissioning Pack 03', favourited: false, scope: projectScope('shard'), updatedAt: now - 14 * day,
      messages: [
      mk('m1', 'user', 'List the hold points on Commissioning Pack 03.', 14 * day),
      mk('m2', 'flint', 'CMS-PCK-03 has 4 hold points: H1 hydrotest sign-off, H2 NDT acceptance, H3 instrument loop check, H4 client witnessed run-in. H1 and H2 cleared; H3 in progress.', 14 * day - 60000)]
    }];

  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const { scope } = useScope();
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
  const [favouriteOrder, setFavouriteOrder] = useState<string[]>(
    () => conversations.filter((c) => c.favourited).map((c) => c.id)
  );
  const active = conversations.find((c) => c.id === activeId) ?? null;
  const messages = useMemo(() => active?.messages ?? [], [active]);
  const setMessages = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setConversations((prev) => {
      let id = activeId;
      let list = prev;
      if (!id) {
        id = 'c-' + Date.now();
        list = [{ id, title: t('chat.newChat'), favourited: false, scope, updatedAt: Date.now(), messages: [] }, ...prev];
        setActiveId(id);
      }
      return list.map((c) =>
      c.id === id ? { ...c, messages: updater(c.messages), updatedAt: Date.now() } : c
      );
    });
  };
  const [inputValue, setInputValue] = useState('');
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
  const addClipboardDoc = (doc: Document) => {
    setSelectedClipboardDocs((prev) =>
      prev.some((d) => d.id === doc.id) ? prev.filter((d) => d.id !== doc.id) : [...prev, doc]
    );
  };
  const renderClipboardTrigger = (direction: 'up' | 'down' = 'up') => (
    <ClipboardDropdown
      align="left"
      direction={direction}
      onDocumentClick={addClipboardDoc}
      selectedDocIds={selectedClipboardDocs.map((d) => d.id)}
    >
      {({ toggle, isOpen }) => (
        <button
          onClick={toggle}
          title={`${t('chat.clipboardTriggerAria')} (${clipboard.length})`}
          className="w-12 h-12 rounded-full bg-white border border-neutral-200 hover:bg-[#F0F4F8] text-neutral-600 flex items-center justify-center transition-colors shrink-0 shadow-sm relative"
          aria-label={t('chat.clipboardTriggerAria')}
          aria-expanded={isOpen}
        >
          <PlusIcon size={18} />
          {clipboard.length > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-[#0461BA] text-white text-[10px] font-bold flex items-center justify-center">
              {clipboard.length}
            </span>
          )}
        </button>
      )}
    </ClipboardDropdown>
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
        list = [{ id, title: titleSource.slice(0, 40), favourited: false, scope, updatedAt: Date.now(), messages: [] }, ...prev];
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
      className="fixed inset-x-0 top-[60px] bottom-0 bg-[var(--main-bg-color)] z-30 flex pl-[var(--left-rail-width,88px)]">

      <LeftRail
        activeItem="chat"
        onItemClick={() => onExit()} />

      <div data-component="page-shell" className="flex-1 w-full p-4">
        <div data-component="page-layout" className="w-full flex items-stretch gap-4 h-[calc(100vh-92px)]">

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
            onFavourite={(id) => {
              setConversations((prev) => prev.map((c) => c.id === id ? { ...c, favourited: !c.favourited } : c));
              setFavouriteOrder((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
            }}
            favouriteOrder={favouriteOrder}
            onReorder={setFavouriteOrder}
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

          {/* Right side: chat content (floating panel) */}
          <div data-component="content-panel" className="flex-1 flex flex-col min-w-0 bg-white rounded-xl shadow-md overflow-hidden h-full">
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
            <p className="text-neutral-500 mb-6 text-center text-base">
              {askAbout
                ? t('chat.suggestionHint')
                : t('chat.subtitle')}
            </p>

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
              {renderClipboardTrigger('down')}
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

            {renderClipboardTrigger('up')}

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

        </div>
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
  activeId: string | null;
  search: string;
  onSearchChange: (v: string) => void;
  renamingId: string | null;
  renameValue: string;
  menuOpenId: string | null;
  onMenuOpen: (id: string | null) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onFavourite: (id: string) => void;
  favouriteOrder: string[];
  onReorder: (newOrder: string[]) => void;
  onDelete: (id: string) => void;
  onStartRename: (id: string, current: string) => void;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
}

function ChatHistorySidebar(p: SidebarProps) {
  const { t } = useLocalization();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const filtered = p.conversations.filter((c) =>
    c.title.toLowerCase().includes(p.search.toLowerCase())
  );
  const favouritedIds = new Set(filtered.filter((c) => c.favourited).map((c) => c.id));
  const favourites = p.favouriteOrder
    .filter((id) => favouritedIds.has(id))
    .map((id) => filtered.find((c) => c.id === id)!)
    .filter(Boolean);
  const recent = filtered.filter((c) => !c.favourited).sort((a, b) => b.updatedAt - a.updatedAt);

  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== dragOverId) setDragOverId(id);
  };
  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return; }
    const next = [...p.favouriteOrder];
    const from = next.indexOf(draggingId);
    const to = next.indexOf(targetId);
    next.splice(from, 1);
    next.splice(to, 0, draggingId);
    p.onReorder(next);
    setDraggingId(null);
    setDragOverId(null);
  };
  const handleDragEnd = () => { setDraggingId(null); setDragOverId(null); };

  if (!p.open) {
    return (
      <div className="w-10 shrink-0 bg-white flex flex-col items-center py-3 gap-2 rounded-xl overflow-hidden shadow-md">
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
      data-component="left-panel"
      className="shrink-0 bg-white flex flex-col relative rounded-xl overflow-hidden shadow-md h-full"
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
        {favourites.length > 0 && (
          <>
            <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-wide text-neutral-400 font-semibold">{t('chat.pinned')}</div>
            {favourites.map((c) => (
              <div
                key={c.id}
                draggable
                onDragStart={() => handleDragStart(c.id)}
                onDragOver={(e) => handleDragOver(e, c.id)}
                onDrop={() => handleDrop(c.id)}
                onDragEnd={handleDragEnd}
                className={`transition-opacity ${draggingId === c.id ? 'opacity-40' : 'opacity-100'} ${dragOverId === c.id && draggingId !== c.id ? 'border-t-2 border-[#0461BA]' : ''}`}
              >
                {renderItem(c, p, true)}
              </div>
            ))}
          </>
        )}
        {recent.length > 0 &&
        <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wide text-neutral-400 font-semibold">{t('chat.recent')}</div>
        }
        {recent.map((c) => renderItem(c, p, false))}
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

function renderItem(c: Conversation, p: SidebarProps, isDraggable = false) {
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

      {isDraggable
        ? <GripVerticalIcon size={13} className="shrink-0 opacity-0 group-hover:opacity-40 cursor-grab text-neutral-400" />
        : <MessageSquareIcon size={14} className="shrink-0 opacity-70" />
      }
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
      {c.favourited && !isRenaming && <StarIcon size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
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
            onClick={(e) => { e.stopPropagation(); p.onFavourite(c.id); p.onMenuOpen(null); }}
            className="w-full px-3 py-1.5 text-left hover:bg-[#F0F4F8] flex items-center gap-2">

              {c.favourited ? <><StarIcon size={14} className="fill-amber-400 text-amber-400" /> {t('chat.unpin')}</> : <><StarIcon size={14} /> {t('chat.pin')}</>}
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
