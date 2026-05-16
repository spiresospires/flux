import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeftRail } from '../components/LeftRail';
import { useLocalization } from '../contexts/LocalizationContext';
import {
  PlusIcon,
  SearchIcon,
  PackageIcon,
  DownloadIcon,
  FileArchiveIcon,
  RefreshCwIcon,
  SendIcon,
  XIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  FolderIcon,
  BookmarkIcon,
  ListIcon,
  HashIcon,
  GripVerticalIcon,
  CheckIcon,
  ArrowLeftIcon,
  AlertCircleIcon,
  ClockIcon,
  UserIcon,
  FileTextIcon,
  EyeIcon,
  TrashIcon } from
'lucide-react';

// ---------- Types ----------
type PackageStatus = 'Draft' | 'In Review' | 'Approved' | 'Issued' | 'Out of Date';
type ChangeState = 'Up to date' | 'Changes detected' | 'New';

interface PackageDoc {
  number: string;
  title: string;
  revision: string;
  status: string;
  sourceFolder: string;
  render: boolean;
  include: boolean;
  section?: string;
}

interface PackageVersion {
  version: string;
  generatedDate: string;
  generatedBy: string;
  summary: string;
}

interface PackageObject {
  reference: string;
  title: string;
  description: string;
  status: PackageStatus;
  revision: string;
  owner: string;
  lastUpdated: string;
  documentCount: number;
  changeState: ChangeState;
  type: string;
  discipline: string;
  area: string;
  dueDate: string;
  lastGenerated: string;
  documents: PackageDoc[];
  versions: PackageVersion[];
  changeLog: { type: string; doc: string; detail: string }[];
}

// ---------- Sample data ----------
const samplePackages: PackageObject[] = [
{
  reference: 'WP-MECH-AREA-01',
  title: 'Mechanical Area 01 — IFC Bundle',
  description: 'Issued for construction bundle covering Area 01 mechanical scope.',
  status: 'Issued',
  revision: 'C02',
  owner: 'Sarah Chen',
  lastUpdated: '2026-04-28',
  documentCount: 42,
  changeState: 'Changes detected',
  type: 'IFC Bundle',
  discipline: 'Mechanical',
  area: 'Area 01',
  dueDate: '2026-05-12',
  lastGenerated: '2026-04-28 14:21',
  documents: [
  { number: 'M-3012-GA-006', title: 'General Arrangement — Pump Skid 06', revision: 'B', status: 'Approved', sourceFolder: '/Mechanical/Area 01/GA', render: true, include: true, section: 'General Arrangements' },
  { number: 'P-1001-PID-001', title: 'P&ID — Cooling Water Loop', revision: 'C', status: 'Approved', sourceFolder: '/Process/PIDs', render: true, include: true, section: 'P&IDs' },
  { number: 'P-1001-PID-002', title: 'P&ID — Steam Distribution', revision: 'B', status: 'Approved', sourceFolder: '/Process/PIDs', render: true, include: true, section: 'P&IDs' },
  { number: 'M-3012-ISO-018', title: 'Isometric — Line 3012-CW-04', revision: 'A', status: 'In Review', sourceFolder: '/Mechanical/Area 01/Isos', render: true, include: true, section: 'Isometrics' },
  { number: 'C-4401-LAY-002', title: 'Civil Layout — Foundations', revision: 'B', status: 'Approved', sourceFolder: '/Civil/Layouts', render: false, include: true, section: 'Civil' }],

  versions: [
  { version: 'C02', generatedDate: '2026-04-28', generatedBy: 'Sarah Chen', summary: '3 revisions updated, 1 document added' },
  { version: 'C01', generatedDate: '2026-03-14', generatedBy: 'Sarah Chen', summary: 'Initial IFC issue' },
  { version: 'B01', generatedDate: '2026-02-02', generatedBy: 'Mark Doyle', summary: 'IFR bundle for internal review' }],

  changeLog: [
  { type: 'Revision changed', doc: 'P-1001-PID-001', detail: 'Rev B → Rev C' },
  { type: 'Document added', doc: 'M-3012-ISO-018', detail: 'Added from /Mechanical/Area 01/Isos' },
  { type: 'Metadata changed', doc: 'C-4401-LAY-002', detail: 'Status changed to Approved' }]

},
{
  reference: 'WP-ELEC-SUBSTATION-A',
  title: 'Substation A — Electrical Issue Pack',
  description: 'Substation A single-line and protection drawings.',
  status: 'In Review',
  revision: 'B03',
  owner: 'Daniel Park',
  lastUpdated: '2026-04-30',
  documentCount: 18,
  changeState: 'Up to date',
  type: 'Issue Pack',
  discipline: 'Electrical',
  area: 'Substation A',
  dueDate: '2026-05-20',
  lastGenerated: '2026-04-30 09:05',
  documents: [
  { number: 'E-2004-SLD-014', title: 'Single Line Diagram — 11kV', revision: 'C', status: 'Approved', sourceFolder: '/Electrical/SLDs', render: true, include: true, section: 'SLDs' },
  { number: 'E-2004-SLD-015', title: 'Single Line Diagram — 415V', revision: 'B', status: 'In Review', sourceFolder: '/Electrical/SLDs', render: true, include: true, section: 'SLDs' },
  { number: 'E-2004-PRT-008', title: 'Protection Schematic — Feeder 03', revision: 'A', status: 'Draft', sourceFolder: '/Electrical/Protection', render: true, include: true, section: 'Protection' }],

  versions: [
  { version: 'B03', generatedDate: '2026-04-30', generatedBy: 'Daniel Park', summary: 'Added protection schematics' },
  { version: 'B02', generatedDate: '2026-04-12', generatedBy: 'Daniel Park', summary: 'Updated SLD revisions' }],

  changeLog: []
},
{
  reference: 'WP-PROC-IFC-BUNDLE-03',
  title: 'Process IFC Bundle 03',
  description: 'Process discipline IFC bundle for Phase 3 turnover.',
  status: 'Draft',
  revision: 'A01',
  owner: 'Priya Natarajan',
  lastUpdated: '2026-05-02',
  documentCount: 67,
  changeState: 'New',
  type: 'IFC Bundle',
  discipline: 'Process',
  area: 'Phase 3',
  dueDate: '2026-06-01',
  lastGenerated: '—',
  documents: [],
  versions: [],
  changeLog: []
},
{
  reference: 'WP-CIV-FOUND-PKG',
  title: 'Civil Foundations Submission',
  description: 'Foundation drawings for client approval.',
  status: 'Approved',
  revision: 'C01',
  owner: 'Marco Rossi',
  lastUpdated: '2026-04-19',
  documentCount: 24,
  changeState: 'Up to date',
  type: 'Submission',
  discipline: 'Civil',
  area: 'Site-wide',
  dueDate: '2026-04-25',
  lastGenerated: '2026-04-19 16:40',
  documents: [],
  versions: [],
  changeLog: []
},
{
  reference: 'WP-INST-LOOP-CHK',
  title: 'Instrumentation Loop Check Pack',
  description: 'Loop check documentation for commissioning.',
  status: 'Out of Date',
  revision: 'B01',
  owner: 'Aisha Khan',
  lastUpdated: '2026-03-22',
  documentCount: 31,
  changeState: 'Changes detected',
  type: 'Commissioning',
  discipline: 'Instrumentation',
  area: 'Area 02',
  dueDate: '2026-05-30',
  lastGenerated: '2026-03-22 11:00',
  documents: [],
  versions: [],
  changeLog: []
},
// --- Additional sample packages ---
mkPkg('WP-PROC-PID-RELEASE-A', 'Process P&ID Release A', 'Approved', 'C04', 'Priya Natarajan', '2026-05-04', 54, 'Up to date', 'Issue Pack', 'Process', 'Phase 3', '2026-05-15'),
mkPkg('WP-MECH-ISO-AREA02', 'Mechanical Isometrics — Area 02', 'In Review', 'B02', 'Sarah Chen', '2026-05-03', 88, 'Up to date', 'IFR Bundle', 'Mechanical', 'Area 02', '2026-05-22'),
mkPkg('WP-ELEC-LIGHTING-PH3', 'Lighting Layouts Phase 3', 'Issued', 'C01', 'Daniel Park', '2026-04-26', 22, 'Up to date', 'IFC Bundle', 'Electrical', 'Phase 3', '2026-05-10'),
mkPkg('WP-INST-DCS-IO-LIST', 'DCS I/O Schedule Bundle', 'Approved', 'C02', 'Aisha Khan', '2026-04-18', 14, 'Up to date', 'Submission', 'Instrumentation', 'Site-wide', '2026-04-30'),
mkPkg('WP-CIV-DRAINAGE', 'Civil Drainage Drawings', 'Draft', 'A02', 'Marco Rossi', '2026-05-05', 19, 'New', 'IFR Bundle', 'Civil', 'Area 03', '2026-06-10'),
mkPkg('WP-STR-STEEL-ERECTION', 'Structural Steel Erection Pack', 'Issued', 'C03', 'Marco Rossi', '2026-04-22', 47, 'Changes detected', 'IFC Bundle', 'Structural', 'Area 01', '2026-05-08'),
mkPkg('WP-HVAC-AHU-COMM', 'HVAC AHU Commissioning Pack', 'In Review', 'B01', 'Lukas Weber', '2026-05-01', 36, 'Up to date', 'Commissioning', 'HVAC', 'Building B', '2026-05-25'),
mkPkg('WP-PIPE-ISO-CW', 'Cooling Water Piping Isometrics', 'Issued', 'C05', 'Sarah Chen', '2026-04-29', 102, 'Up to date', 'IFC Bundle', 'Piping', 'Area 01', '2026-05-12'),
mkPkg('WP-PIPE-CLASS-150CS', 'Piping Class 150# CS Update', 'Approved', 'B04', 'Hugo Martinez', '2026-04-12', 8, 'Up to date', 'Specification', 'Piping', 'Site-wide', '2026-04-20'),
mkPkg('WP-PROC-HAZOP-CLOSE', 'HAZOP Closeout Documentation', 'Approved', 'C01', 'Priya Natarajan', '2026-04-10', 27, 'Up to date', 'Submission', 'Process', 'Site-wide', '2026-04-30'),
mkPkg('WP-ELEC-MCC03-CABLES', 'MCC-03 Cable Schedule Pack', 'Out of Date', 'B02', 'Daniel Park', '2026-03-30', 18, 'Changes detected', 'Issue Pack', 'Electrical', 'Building C', '2026-05-18'),
mkPkg('WP-INST-FAT-SUBSEA', 'Subsea Instruments FAT Pack', 'In Review', 'B01', 'Aisha Khan', '2026-05-04', 12, 'Up to date', 'Vendor', 'Instrumentation', 'Subsea', '2026-05-28'),
mkPkg('WP-MECH-VENDOR-PUMPS', 'Pump Vendor Documentation', 'Approved', 'C02', 'Sarah Chen', '2026-04-15', 31, 'Up to date', 'Vendor', 'Mechanical', 'Area 01', '2026-04-25'),
mkPkg('WP-HSE-PERMIT-PACK', 'Site Permit-to-Work Pack', 'Issued', 'C06', 'Aisha Khan', '2026-05-02', 9, 'Up to date', 'Submission', 'HSE', 'Site-wide', '2026-05-09'),
mkPkg('WP-QA-NDT-RECORDS', 'NDT Records Bundle', 'Approved', 'C01', 'Mark Doyle', '2026-04-20', 64, 'Up to date', 'Quality', 'QA/QC', 'Area 01', '2026-05-01'),
mkPkg('WP-COMM-LOOP-AREA02', 'Area 02 Loop Commissioning', 'Draft', 'A01', 'Aisha Khan', '2026-05-05', 41, 'New', 'Commissioning', 'Instrumentation', 'Area 02', '2026-06-15'),
mkPkg('WP-PROC-IFC-BUNDLE-04', 'Process IFC Bundle 04', 'In Review', 'B01', 'Priya Natarajan', '2026-05-06', 73, 'Up to date', 'IFC Bundle', 'Process', 'Phase 4', '2026-06-20'),
mkPkg('WP-CIV-ROADS-EARTHWORK', 'Roads & Earthworks Submission', 'Approved', 'C02', 'Marco Rossi', '2026-03-28', 33, 'Up to date', 'Submission', 'Civil', 'Site-wide', '2026-04-05'),
mkPkg('WP-STR-CONCRETE-FOUND', 'Concrete Foundations Detail Pack', 'Issued', 'C04', 'Marco Rossi', '2026-04-08', 58, 'Up to date', 'IFC Bundle', 'Structural', 'Area 02', '2026-04-18'),
mkPkg('WP-ELEC-EARTHING-LV', 'LV Earthing & Bonding Pack', 'Draft', 'A01', 'Daniel Park', '2026-05-06', 11, 'New', 'IFR Bundle', 'Electrical', 'Substation B', '2026-06-05'),
mkPkg('WP-HVAC-DUCT-LAYOUT', 'HVAC Duct Layout Drawings', 'In Review', 'B02', 'Lukas Weber', '2026-04-25', 26, 'Changes detected', 'IFR Bundle', 'HVAC', 'Building A', '2026-05-15'),
mkPkg('WP-PIPE-STRESS-ANAL', 'Piping Stress Analysis Reports', 'Approved', 'C03', 'Hugo Martinez', '2026-04-14', 17, 'Up to date', 'Specification', 'Piping', 'Area 01', '2026-04-26'),
mkPkg('WP-TELECOM-FIBRE', 'Telecom Fibre Routing Pack', 'In Review', 'B01', 'Lukas Weber', '2026-05-02', 23, 'Up to date', 'Issue Pack', 'Telecom', 'Site-wide', '2026-05-20'),
mkPkg('WP-FIRE-DETECT-DESIGN', 'Fire Detection Design Pack', 'Approved', 'C02', 'Aisha Khan', '2026-04-18', 19, 'Up to date', 'Submission', 'HSE', 'Building B', '2026-05-01'),
mkPkg('WP-MECH-LIFTING-PLAN', 'Lifting & Rigging Plan Pack', 'Issued', 'C01', 'Sarah Chen', '2026-04-30', 14, 'Up to date', 'Submission', 'Mechanical', 'Area 01', '2026-05-08'),
mkPkg('WP-PROC-VENDOR-COL', 'Distillation Column Vendor Pack', 'Out of Date', 'B03', 'Priya Natarajan', '2026-03-15', 88, 'Changes detected', 'Vendor', 'Process', 'Phase 3', '2026-05-25'),
mkPkg('WP-QA-WPS-PQR', 'Welding WPS / PQR Records', 'Approved', 'C04', 'Mark Doyle', '2026-04-02', 42, 'Up to date', 'Quality', 'QA/QC', 'Site-wide', '2026-04-15'),
mkPkg('WP-COMM-PRECOMM', 'Pre-Commissioning Records', 'Draft', 'A03', 'Aisha Khan', '2026-05-05', 56, 'New', 'Commissioning', 'Multidiscipline', 'Phase 3', '2026-06-30')];



function mkPkg(reference: string, title: string, status: PackageStatus, revision: string, owner: string, lastUpdated: string, documentCount: number, changeState: ChangeState, type: string, discipline: string, area: string, dueDate: string): PackageObject {
  return {
    reference,
    title,
    description: `${title} — generated for ${area}.`,
    status,
    revision,
    owner,
    lastUpdated,
    documentCount,
    changeState,
    type,
    discipline,
    area,
    dueDate,
    lastGenerated: status === 'Draft' ? '—' : `${lastUpdated} 10:00`,
    documents: [],
    versions: status === 'Draft' ? [] : [{ version: revision, generatedDate: lastUpdated, generatedBy: owner, summary: 'Generated' }],
    changeLog: changeState === 'Changes detected' ? [{ type: 'Revision changed', doc: '—', detail: 'Source documents updated' }] : []
  };
}


const statusStyles: Record<PackageStatus, string> = {
  'Draft': 'bg-neutral-100 text-neutral-700 border-neutral-200',
  'In Review': 'bg-amber-50 text-amber-800 border-amber-200',
  'Approved': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Issued': 'bg-blue-50 text-blue-800 border-blue-200',
  'Out of Date': 'bg-rose-50 text-rose-800 border-rose-200'
};

const changeStateStyles: Record<ChangeState, string> = {
  'Up to date': 'text-emerald-700',
  'Changes detected': 'text-amber-700',
  'New': 'text-neutral-500'
};

function translatePackageStatus(t: (key: string, variables?: Record<string, string | number>) => string, status: PackageStatus | string) {
  switch (status) {
    case 'Draft':
      return t('statuses.draft');
    case 'In Review':
      return t('statuses.inReview');
    case 'Approved':
      return t('statuses.approved');
    case 'Issued':
      return t('statuses.issued');
    case 'Out of Date':
      return t('statuses.outOfDate');
    default:
      return status;
  }
}

function translateChangeState(t: (key: string, variables?: Record<string, string | number>) => string, state: ChangeState | string) {
  switch (state) {
    case 'Up to date':
      return t('statuses.upToDate');
    case 'Changes detected':
      return t('statuses.changesDetected');
    case 'New':
      return t('statuses.new');
    default:
      return state;
  }
}

// ---------- Page ----------
type View = 'library' | 'wizard' | 'detail';

export function Packages() {
  const { t } = useLocalization();
  const [activeRailItem, setActiveRailItem] = useState('packages');
  const [view, setView] = useState<View>('library');
  const [packages, setPackages] = useState<PackageObject[]>(samplePackages);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const selectedPackage = useMemo(
    () => packages.find((p) => p.reference === selectedRef) ?? null,
    [packages, selectedRef]
  );

  const openDetail = (ref: string) => {
    setSelectedRef(ref);
    setView('detail');
  };

  const handleRepackage = (ref: string) => {
    setPackages((prev) =>
    prev.map((p) => {
      if (p.reference !== ref) return p;
      const nextRev = bumpRevision(p.revision);
      const newVersion: PackageVersion = {
        version: nextRev,
        generatedDate: new Date().toISOString().slice(0, 10),
        generatedBy: 'You',
        summary: t('packages.repackagedSummary')
      };
      return {
        ...p,
        revision: nextRev,
        status: 'Issued',
        changeState: 'Up to date',
        lastGenerated: new Date().toISOString().slice(0, 16).replace('T', ' '),
        lastUpdated: new Date().toISOString().slice(0, 10),
        versions: [newVersion, ...p.versions]
      };
    })
    );
    showToast(t('packages.repackagedToast'));
  };

  return (
    <div
      className="h-[calc(100vh-45px)] mt-[45px] font-sans overflow-y-auto p-3"
      style={{
        backgroundColor: 'var(--main-bg-color, #EAEEF6)'
      }}>
      <LeftRail
        activeItem={activeRailItem}
        onItemClick={setActiveRailItem}
        onChatClick={() => {}} />

      <main className="ml-[var(--left-rail-width,88px)]">
        {view === 'library' &&
        <PackageLibrary
          packages={packages}
          onOpen={openDetail}
          onNew={() => setView('wizard')}
          onRepackage={handleRepackage}
          onAction={showToast} />

        }
        {view === 'wizard' &&
        <CreatePackageWizard
          onCancel={() => setView('library')}
          onCreate={(pkg) => {
            setPackages((prev) => [pkg, ...prev]);
            setSelectedRef(pkg.reference);
            setView('detail');
            showToast(t('packages.packageGenerated'));
          }} />

        }
        {view === 'detail' && selectedPackage &&
        <PackageDetail
          pkg={selectedPackage}
          onBack={() => setView('library')}
          onRepackage={() => handleRepackage(selectedPackage.reference)}
          onAction={showToast} />

        }
      </main>

      {toast &&
      <div className="fixed bottom-6 right-6 bg-neutral-900 text-white text-sm px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2 z-50">
          <CheckIcon size={16} />
          {toast}
        </div>
      }
    </div>);

}

function bumpRevision(rev: string) {
  const m = rev.match(/^([A-Z])(\d+)$/);
  if (!m) return rev;
  const n = (parseInt(m[2], 10) + 1).toString().padStart(2, '0');
  return `${m[1]}${n}`;
}

// ---------- Library ----------
function PackageLibrary({
  packages,
  onOpen,
  onNew,
  onRepackage,
  onAction



}: {packages: PackageObject[];onOpen: (ref: string) => void;onNew: () => void;onRepackage: (ref: string) => void;onAction: (msg: string) => void;}) {
  const { t } = useLocalization();
  const [statusFilter, setStatusFilter] = useState<Set<PackageStatus>>(new Set());
  const [disciplineFilter, setDisciplineFilter] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [ownerFilter, setOwnerFilter] = useState<Set<string>>(new Set());
  const [changeFilter, setChangeFilter] = useState<Set<ChangeState>>(new Set());
  const [search, setSearch] = useState('');

  const allStatuses: PackageStatus[] = ['Draft', 'In Review', 'Approved', 'Issued', 'Out of Date'];
  const allChange: ChangeState[] = ['Up to date', 'Changes detected', 'New'];
  const allDisciplines = Array.from(new Set(packages.map((p) => p.discipline))).sort();
  const allTypes = Array.from(new Set(packages.map((p) => p.type))).sort();
  const allOwners = Array.from(new Set(packages.map((p) => p.owner))).sort();

  const filtered = packages.filter((p) => {
    if (statusFilter.size > 0 && !statusFilter.has(p.status)) return false;
    if (disciplineFilter.size > 0 && !disciplineFilter.has(p.discipline)) return false;
    if (typeFilter.size > 0 && !typeFilter.has(p.type)) return false;
    if (ownerFilter.size > 0 && !ownerFilter.has(p.owner)) return false;
    if (changeFilter.size > 0 && !changeFilter.has(p.changeState)) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
      !p.reference.toLowerCase().includes(s) &&
      !p.title.toLowerCase().includes(s) &&
      !p.description.toLowerCase().includes(s))
      return false;
    }
    return true;
  });

  const toggle = <T,>(set: Set<T>, val: T, setter: (s: Set<T>) => void) => {
    const n = new Set(set);
    if (n.has(val)) n.delete(val);else
    n.add(val);
    setter(n);
  };

  const clearAll = () => {
    setStatusFilter(new Set());
    setDisciplineFilter(new Set());
    setTypeFilter(new Set());
    setOwnerFilter(new Set());
    setChangeFilter(new Set());
    setSearch('');
  };

  const activeCount =
  statusFilter.size + disciplineFilter.size + typeFilter.size +
  ownerFilter.size + changeFilter.size + (search ? 1 : 0);

  return (
    <div>
      <div className="flex gap-4 items-start">
        {/* Left filter panel */}
        <aside className="w-64 shrink-0 bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">{t('packages.filters')}</h3>
            {activeCount > 0 &&
            <button onClick={clearAll} className="text-xs text-[#0461BA] hover:underline">
                {t('packages.clear', { count: activeCount })}
              </button>
            }
          </div>
          <div className="p-3">
            <div className="relative mb-3">
              <SearchIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('packages.searchPackages')}
                className="w-full h-8 pl-8 pr-2 rounded-md border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:bg-white" />

            </div>
            <FilterGroup label={t('packages.status')}>
              {allStatuses.map((s) =>
              <CheckRow
                key={s}
                checked={statusFilter.has(s)}
                onChange={() => toggle(statusFilter, s, setStatusFilter)}
                label={
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusStyles[s]}`}>
                      {s}
                    </span>
                } />

              )}
            </FilterGroup>
            <FilterGroup label={t('packages.changeState')}>
              {allChange.map((c) =>
              <CheckRow
                key={c}
                checked={changeFilter.has(c)}
                onChange={() => toggle(changeFilter, c, setChangeFilter)}
                label={<span className={`text-xs ${changeStateStyles[c]}`}>{c}</span>} />

              )}
            </FilterGroup>
            <FilterGroup label={t('packages.discipline')}>
              {allDisciplines.map((d) =>
              <CheckRow
                key={d}
                checked={disciplineFilter.has(d)}
                onChange={() => toggle(disciplineFilter, d, setDisciplineFilter)}
                label={<span className="text-sm text-neutral-700">{d}</span>} />

              )}
            </FilterGroup>
            <FilterGroup label={t('packages.type')}>
              {allTypes.map((t) =>
              <CheckRow
                key={t}
                checked={typeFilter.has(t)}
                onChange={() => toggle(typeFilter, t, setTypeFilter)}
                label={<span className="text-sm text-neutral-700">{t}</span>} />

              )}
            </FilterGroup>
            <FilterGroup label={t('packages.owner')} last>
              {allOwners.map((o) =>
              <CheckRow
                key={o}
                checked={ownerFilter.has(o)}
                onChange={() => toggle(ownerFilter, o, setOwnerFilter)}
                label={<span className="text-sm text-neutral-700">{o}</span>} />

              )}
            </FilterGroup>
          </div>
        </aside>

        {/* Right: table */}
        <div className="flex-1 min-w-0 bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
            <p className="text-xs font-medium text-neutral-600">{t('packages.packagesCount', { count: filtered.length })}</p>
            <button
              onClick={onNew}
              className="inline-flex items-center gap-2 h-7 px-3 rounded-md bg-[#0461BA] text-white text-xs font-medium hover:bg-[#035299] transition-colors">
              <PlusIcon size={14} />
              {t('packages.newPackage')}
            </button>
          </div>

          {activeCount > 0 &&
          <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-1 border-b border-neutral-100 bg-white shrink-0">
              {search &&
              <FilterPill label={t('packages.searchFilter', { value: search })} onClear={() => setSearch('')} />
              }
              {[...statusFilter].map((v) =>
              <FilterPill key={`s-${v}`} label={t('packages.statusFilter', { value: v })} onClear={() => toggle(statusFilter, v, setStatusFilter)} />
              )}
              {[...changeFilter].map((v) =>
              <FilterPill key={`c-${v}`} label={t('packages.changeFilter', { value: v })} onClear={() => toggle(changeFilter, v, setChangeFilter)} />
              )}
              {[...disciplineFilter].map((v) =>
              <FilterPill key={`d-${v}`} label={`Discipline: ${v}`} onClear={() => toggle(disciplineFilter, v, setDisciplineFilter)} />
              )}
              {[...typeFilter].map((v) =>
              <FilterPill key={`t-${v}`} label={`Type: ${v}`} onClear={() => toggle(typeFilter, v, setTypeFilter)} />
              )}
              {[...ownerFilter].map((v) =>
              <FilterPill key={`o-${v}`} label={`Owner: ${v}`} onClear={() => toggle(ownerFilter, v, setOwnerFilter)} />
              )}
              <button
                onClick={clearAll}
                className="ml-1 text-xs text-rose-600 hover:underline">
                {t('packages.clearAllFilters')}
              </button>
            </div>
          }

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">{t('packages.reference')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('packages.title')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('packages.status')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('packages.rev')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('packages.owner')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('packages.lastUpdated')}</th>
              <th className="text-right px-4 py-2.5 font-medium">{t('packages.docs')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('packages.changeState')}</th>
              <th className="text-right px-4 py-2.5 font-medium">{t('packages.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) =>
              <tr key={p.reference} className="border-b border-neutral-100 hover:bg-neutral-50/60">
                <td className="px-4 py-3">
                  <button
                    onClick={() => onOpen(p.reference)}
                    className="font-mono text-xs text-[#0461BA] hover:underline">
                    {p.reference}
                  </button>
                </td>
                <td className="px-4 py-3 text-neutral-900">{p.title}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusStyles[p.status]}`}>
                    {translatePackageStatus(t, p.status)}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-700">{p.revision}</td>
                <td className="px-4 py-3 text-neutral-700">{p.owner}</td>
                <td className="px-4 py-3 text-neutral-500">{p.lastUpdated}</td>
                <td className="px-4 py-3 text-right text-neutral-700">{p.documentCount}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${changeStateStyles[p.changeState]}`}>
                    {p.changeState !== 'Up to date' && <AlertCircleIcon size={12} className="inline mr-1 -mt-0.5" />}
                    {translateChangeState(t, p.changeState)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {/* Removed EyeIcon (Open) button */}
                    <IconBtn title={t('packages.repackage')} onClick={() => onRepackage(p.reference)}><RefreshCwIcon size={14} /></IconBtn>
                    <IconBtn title={t('packages.issueTransmit')} onClick={() => onAction(t('packages.transmittalStarted'))}><SendIcon size={14} /></IconBtn>
                    <IconBtn title={t('packages.downloadPdf')} onClick={() => onAction(t('packages.downloadingPdf'))}><DownloadIcon size={14} /></IconBtn>
                    <IconBtn title={t('packages.downloadZip')} onClick={() => onAction(t('packages.downloadingZip'))}><FileArchiveIcon size={14} /></IconBtn>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
          </div>
          {filtered.length === 0 &&
          <div className="p-10 text-center text-neutral-500 text-sm flex items-center justify-center flex-1">{t('packages.noPackagesMatch')}</div>
          }
        </div>
      </div>

      {/* Concept callout */}
      <div className="mt-8 p-4 bg-[#E8F1FB] border border-[#BAD4EE] rounded-lg text-sm text-[#0B3A6F] flex gap-3">
        <PackageIcon size={18} className="flex-shrink-0 mt-0.5" />
        <div>
          <strong>{t('packages.packagesIndependent')}</strong> {t('packages.packagesConcept')}
        </div>
      </div>
    </div>);

}

function FilterGroup({ label, children, last }: {label: string;children: React.ReactNode;last?: boolean;}) {
  return (
    <div className={last ? '' : 'mb-3 pb-3 border-b border-neutral-100'}>
      <div className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold mb-1.5">{label}</div>
      <div className="space-y-1">{children}</div>
    </div>);

}

function CheckRow({ checked, onChange, label }: {checked: boolean;onChange: () => void;label: React.ReactNode;}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 px-1 py-0.5 rounded">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-[#0461BA]" />
      {label}
    </label>);

}

function FilterPill({ label, onClear }: {label: string;onClear: () => void;}) {
  const { t } = useLocalization();
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
      {label}
      <button onClick={onClear} className="hover:text-rose-600 transition-colors" aria-label={t('packages.clearFilter', { label })}>
        <XIcon size={12} />
      </button>
    </span>);

}

function IconBtn({ children, title, onClick }: {children: React.ReactNode;title: string;onClick: () => void;}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-7 h-7 inline-flex items-center justify-center text-neutral-500 hover:text-[#0461BA] hover:bg-[#E8F1FB] rounded">

      {children}
    </button>);

}

// ---------- Wizard ----------
function CreatePackageWizard({
  onCancel,
  onCreate



}: {onCancel: () => void;onCreate: (pkg: PackageObject) => void;}) {
  const { t } = useLocalization();
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({
    reference: 'WP-MECH-AREA-02',
    title: 'Mechanical Area 02 — IFR Bundle',
    description: 'Issued for review bundle covering Area 02 mechanical scope.',
    type: 'IFR Bundle',
    discipline: 'Mechanical',
    area: 'Area 02',
    owner: 'You',
    dueDate: '2026-06-15'
  });
  const [docs, setDocs] = useState<PackageDoc[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [includeLinked, setIncludeLinked] = useState(true);
  const [renderAll, setRenderAll] = useState(true);

  const next = () => setStep((s) => Math.min(4, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const generate = () => {
    const today = new Date().toISOString().slice(0, 10);
    const pkg: PackageObject = {
      ...details,
      status: 'Draft',
      revision: 'A01',
      lastUpdated: today,
      documentCount: docs.length,
      changeState: 'New',
      lastGenerated: new Date().toISOString().slice(0, 16).replace('T', ' '),
      documents: docs.map((d) => ({ ...d, render: renderAll ? d.render : false })),
      versions: [{ version: 'A01', generatedDate: today, generatedBy: 'You', summary: 'Initial generation' }],
      changeLog: []
    };
    onCreate(pkg);
  };

  return (
    <div>
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-3">

        <ArrowLeftIcon size={14} /> {t('packages.backToPackages')}
      </button>
      <h1 className="text-2xl font-semibold text-neutral-900 mb-1">{t('packages.createTitle')}</h1>
      <p className="text-sm text-neutral-500 mb-6">{t('packages.createSubtitle')}</p>

      {/* Stepper */}
      <Stepper step={step} steps={[t('packages.steps.details'), t('packages.steps.addDocuments'), t('packages.steps.organise'), t('packages.steps.reviewGenerate')]} />

      <div className="bg-white border border-neutral-200 rounded-lg p-6 mt-6">
        {step === 1 &&
        <div className="grid grid-cols-2 gap-4 max-w-3xl">
            <Field label={t('packages.packageReference')}><input value={details.reference} onChange={(e) => setDetails({ ...details, reference: e.target.value })} className={inputCls} /></Field>
            <Field label={t('packages.title')}><input value={details.title} onChange={(e) => setDetails({ ...details, title: e.target.value })} className={inputCls} /></Field>
            <Field label={t('packages.description')} full><textarea value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} rows={3} className={inputCls} /></Field>
            <Field label={t('packages.packageType')}>
              <select value={details.type} onChange={(e) => setDetails({ ...details, type: e.target.value })} className={inputCls}>
                <option>IFC Bundle</option><option>IFR Bundle</option><option>Submission</option><option>Commissioning</option><option>Issue Pack</option>
              </select>
            </Field>
            <Field label={t('packages.discipline')}>
              <select value={details.discipline} onChange={(e) => setDetails({ ...details, discipline: e.target.value })} className={inputCls}>
                <option>Mechanical</option><option>Electrical</option><option>Process</option><option>Civil</option><option>Instrumentation</option>
              </select>
            </Field>
            <Field label={t('packages.projectArea')}><input value={details.area} onChange={(e) => setDetails({ ...details, area: e.target.value })} className={inputCls} /></Field>
            <Field label={t('packages.owner')}><input value={details.owner} onChange={(e) => setDetails({ ...details, owner: e.target.value })} className={inputCls} /></Field>
            <Field label={t('packages.dueDate')}><input type="date" value={details.dueDate} onChange={(e) => setDetails({ ...details, dueDate: e.target.value })} className={inputCls} /></Field>
          </div>
        }

        {step === 2 &&
        <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">{t('packages.addDocumentsTitle')}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{t('packages.addDocumentsSubtitle')}</p>
              </div>
              <button onClick={() => setShowAdd(true)} className="h-8 px-3 rounded-md bg-[#0461BA] text-white text-sm hover:bg-[#035299] inline-flex items-center gap-1.5">
                <PlusIcon size={14} /> Add documents
              </button>
            </div>

            {docs.length === 0 ?
          <div className="border-2 border-dashed border-neutral-200 rounded-md p-10 text-center">
                <PackageIcon size={32} className="mx-auto text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-600 mb-4">{t('packages.noDocumentsYet')}</p>
                <button onClick={() => setShowAdd(true)} className="h-8 px-3 rounded-md border border-neutral-200 text-sm hover:bg-neutral-50">
                  {t('packages.addDocumentsTitle')}
                </button>
              </div> :

          <div className="border border-neutral-200 rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">{t('packages.documentNumber')}</th>
                      <th className="text-left px-3 py-2 font-medium">{t('packages.title')}</th>
                      <th className="text-left px-3 py-2 font-medium">{t('packages.rev')}</th>
                      <th className="text-left px-3 py-2 font-medium">{t('packages.sourceFolder')}</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((d, i) =>
                <tr key={i} className="border-b border-neutral-100 last:border-0">
                        <td className="px-3 py-2 font-mono text-xs">{d.number}</td>
                        <td className="px-3 py-2">{d.title}</td>
                        <td className="px-3 py-2 font-mono text-xs">{d.revision}</td>
                        <td className="px-3 py-2 text-neutral-500 text-xs">{d.sourceFolder}</td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => setDocs(docs.filter((_, j) => j !== i))} className="text-neutral-400 hover:text-rose-600">
                            <TrashIcon size={14} />
                          </button>
                        </td>
                      </tr>
                )}
                  </tbody>
                </table>
              </div>
          }

            {showAdd &&
          <AddDocumentsModal
            onClose={() => setShowAdd(false)}
            onAdd={(newDocs) => {
              setDocs((prev) => [...prev, ...newDocs]);
              setShowAdd(false);
            }} />

          }
          </div>
        }

        {step === 3 &&
        <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">{t('packages.organiseContents')}</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <div className="border border-neutral-200 rounded-md">
                  {docs.length === 0 &&
                <div className="p-6 text-center text-sm text-neutral-500">{t('packages.noDocumentsToOrganise')}</div>
                }
                  {docs.map((d, i) =>
                <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                      <GripVerticalIcon size={14} className="text-neutral-400 cursor-grab" />
                      <span className="text-xs text-neutral-400 w-6">{i + 1}</span>
                      <span className="font-mono text-xs flex-1">{d.number}</span>
                      <span className="text-sm text-neutral-700 flex-[2] truncate">{d.title}</span>
                      <button
                    onClick={() => setDocs(docs.map((x, j) => j === i ? { ...x, render: !x.render } : x))}
                    className={`text-xs px-2 py-0.5 rounded border ${d.render ? 'bg-[#E8F1FB] border-[#BAD4EE] text-[#0461BA]' : 'bg-white border-neutral-200 text-neutral-500'}`}>

                        {d.render ? t('packages.render') : t('packages.linkOnly')}
                      </button>
                      <button
                    onClick={() => setDocs(docs.map((x, j) => j === i ? { ...x, include: !x.include } : x))}
                    className={`text-xs px-2 py-0.5 rounded border ${d.include ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>

                        {d.include ? t('packages.included') : t('packages.excluded')}
                      </button>
                      <div className="flex flex-col -space-y-px">
                        <button
                      onClick={() => i > 0 && setDocs(swap(docs, i, i - 1))}
                      className="text-neutral-400 hover:text-neutral-700 text-[10px]">▲</button>
                        <button
                      onClick={() => i < docs.length - 1 && setDocs(swap(docs, i, i + 1))}
                      className="text-neutral-400 hover:text-neutral-700 text-[10px]">▼</button>
                      </div>
                    </div>
                )}
                </div>
                <button className="mt-3 text-sm text-[#0461BA] hover:underline inline-flex items-center gap-1">
                  <PlusIcon size={14} /> {t('packages.addSection')}
                </button>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase text-neutral-500 tracking-wide">{t('packages.options')}</h4>
                <Toggle label={t('packages.includeAttachments')} checked={includeAttachments} onChange={setIncludeAttachments} />
                <Toggle label={t('packages.includeLinkedDocuments')} checked={includeLinked} onChange={setIncludeLinked} />
                <Toggle label={t('packages.renderAllPdf')} checked={renderAll} onChange={setRenderAll} />
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {t('packages.excludedHelp')}
                </p>
              </div>
            </div>
          </div>
        }

        {step === 4 &&
        <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">{t('packages.reviewGenerateTitle')}</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <SummaryRow k={t('packages.reference')} v={details.reference} />
                <SummaryRow k={t('packages.title')} v={details.title} />
                <SummaryRow k={t('packages.type')} v={details.type} />
                <SummaryRow k={t('packages.discipline')} v={details.discipline} />
                <SummaryRow k={t('packages.area')} v={details.area} />
                <SummaryRow k={t('packages.owner')} v={details.owner} />
                <SummaryRow k={t('packages.dueDate')} v={details.dueDate} />
              </div>
              <div className="space-y-3">
                <SummaryRow k={t('packages.documents')} v={t('packages.documentsIncluded', { count: docs.length })} />
                <SummaryRow k={t('packages.render')} v={renderAll ? t('packages.renderSummaryAll') : t('packages.renderSummarySelected')} />
                <SummaryRow k={t('packages.attachments')} v={includeAttachments ? t('packages.included') : t('packages.excluded')} />
                <SummaryRow k={t('packages.linkedDocuments')} v={includeLinked ? t('packages.included') : t('packages.excluded')} />
                <SummaryRow k={t('packages.output')} v={t('packages.outputPdfZip')} />
              </div>
            </div>
            <div className="mt-6 p-4 bg-neutral-50 rounded-md border border-neutral-200 text-sm text-neutral-600">
              {t('packages.generateHelp')}
            </div>
          </div>
        }

        {/* Footer nav */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200">
          <button onClick={onCancel} className="text-sm text-neutral-500 hover:text-neutral-900">{t('common.cancel')}</button>
          <div className="flex items-center gap-2">
            {step > 1 &&
            <button onClick={prev} className="h-9 px-4 rounded-md border border-neutral-200 text-sm hover:bg-neutral-50 inline-flex items-center gap-1.5">
                <ChevronLeftIcon size={14} /> {t('common.back')}
              </button>
            }
            {step < 4 &&
            <button onClick={next} className="h-9 px-4 rounded-md bg-[#0461BA] text-white text-sm hover:bg-[#035299] inline-flex items-center gap-1.5">
                {t('packages.next')} <ChevronRightIcon size={14} />
              </button>
            }
            {step === 4 &&
            <button onClick={generate} className="h-9 px-4 rounded-md bg-[#0461BA] text-white text-sm hover:bg-[#035299] inline-flex items-center gap-1.5">
                <PackageIcon size={14} /> {t('packages.generatePackage')}
              </button>
            }
          </div>
        </div>
      </div>
    </div>);

}

function swap<T>(arr: T[], i: number, j: number): T[] {
  const n = [...arr];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
}

const inputCls = 'w-full h-9 px-3 rounded-md border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0461BA]';

function Field({ label, children, full }: {label: string;children: React.ReactNode;full?: boolean;}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-neutral-600 mb-1.5">{label}</label>
      {children}
    </div>);

}

function Toggle({ label, checked, onChange }: {label: string;checked: boolean;onChange: (v: boolean) => void;}) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-[#0461BA]' : 'bg-neutral-300'}`}>

        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
      {label}
    </label>);

}

function SummaryRow({ k, v }: {k: string;v: string;}) {
  return (
    <div className="flex text-sm">
      <span className="w-40 text-neutral-500">{k}</span>
      <span className="text-neutral-900 font-medium">{v}</span>
    </div>);

}

function Stepper({ step, steps }: {step: number;steps: string[];}) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
              done ? 'bg-emerald-500 text-white' : active ? 'bg-[#0461BA] text-white' : 'bg-neutral-200 text-neutral-500'}`
              }>
                {done ? <CheckIcon size={12} /> : n}
              </div>
              <span className={`text-sm ${active ? 'text-neutral-900 font-medium' : 'text-neutral-500'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-neutral-200 max-w-[60px]" />}
          </React.Fragment>);

      })}
    </div>);

}

// ---------- Add Documents Modal ----------
function AddDocumentsModal({ onClose, onAdd }: {onClose: () => void;onAdd: (docs: PackageDoc[]) => void;}) {
  const { t } = useLocalization();
  const [tab, setTab] = useState<'folder' | 'search' | 'view' | 'register' | 'manual'>('folder');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [manualNumbers, setManualNumbers] = useState('');

  const sources: PackageDoc[] = [
  { number: 'M-3012-GA-006', title: 'General Arrangement — Pump Skid 06', revision: 'B', status: 'Approved', sourceFolder: '/Mechanical/Area 02/GA', render: true, include: true },
  { number: 'M-3012-GA-007', title: 'General Arrangement — Pump Skid 07', revision: 'A', status: 'In Review', sourceFolder: '/Mechanical/Area 02/GA', render: true, include: true },
  { number: 'P-1001-PID-014', title: 'P&ID — Lube Oil System', revision: 'B', status: 'Approved', sourceFolder: '/Process/PIDs', render: true, include: true },
  { number: 'E-2004-SLD-022', title: 'SLD — Motor Control Centre', revision: 'A', status: 'Draft', sourceFolder: '/Electrical/SLDs', render: true, include: true },
  { number: 'C-4401-LAY-008', title: 'Civil Layout — Pipe Rack', revision: 'B', status: 'Approved', sourceFolder: '/Civil/Layouts', render: false, include: true }];


  const toggle = (n: string) => setSelected((s) => ({ ...s, [n]: !s[n] }));
  const confirm = () => {
    if (tab === 'manual') {
      const lines = manualNumbers.split('\n').map((l) => l.trim()).filter(Boolean);
      const docs = lines.map((number) => ({
        number,
        title: '(Resolved on save)',
        revision: '—',
        status: 'Pending',
        sourceFolder: '— added by number —',
        render: true,
        include: true
      } as PackageDoc));
      onAdd(docs);
      return;
    }
    const picked = sources.filter((d) => selected[d.number]);
    onAdd(picked);
  };

  const tabs = [
  { id: 'folder', label: t('packages.folderBrowser'), icon: FolderIcon },
  { id: 'search', label: t('packages.searchResults'), icon: SearchIcon },
  { id: 'view', label: t('packages.savedView'), icon: BookmarkIcon },
  { id: 'register', label: t('packages.documentRegister'), icon: ListIcon },
  { id: 'manual', label: t('packages.enterNumbers'), icon: HashIcon }] as
  const;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200">
          <h3 className="text-base font-semibold text-neutral-900">{t('packages.addToPackageTitle')}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700"><XIcon size={18} /></button>
        </div>
        <div className="flex border-b border-neutral-200">
          {tabs.map((t) =>
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm inline-flex items-center gap-1.5 border-b-2 ${
            tab === t.id ?
            'border-[#0461BA] text-[#0461BA]' :
            'border-transparent text-neutral-500 hover:text-neutral-900'}`
            }>

              <t.icon size={14} />
              {t.label}
            </button>
          )}
        </div>
        <div className="flex-1 overflow-auto p-4">
          {tab !== 'manual' &&
          <>
              <p className="text-xs text-neutral-500 mb-3">
                {tab === 'folder' && t('packages.folderSourceHelp')}
                {tab === 'search' && t('packages.searchSourceHelp')}
                {tab === 'view' && t('packages.viewSourceHelp')}
                {tab === 'register' && t('packages.registerSourceHelp')}
              </p>
              <div className="border border-neutral-200 rounded-md">
                {sources.map((d) =>
              <label key={d.number} className="flex items-center gap-3 px-3 py-2 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 cursor-pointer">
                    <input type="checkbox" checked={!!selected[d.number]} onChange={() => toggle(d.number)} />
                    <span className="font-mono text-xs w-32">{d.number}</span>
                    <span className="text-sm flex-1 truncate">{d.title}</span>
                    <span className="text-xs text-neutral-500">{d.sourceFolder}</span>
                    <span className="font-mono text-xs text-neutral-500">{d.revision}</span>
                  </label>
              )}
              </div>
            </>
          }
          {tab === 'manual' &&
          <div>
              <p className="text-xs text-neutral-500 mb-2">{t('packages.pasteNumbers')}</p>
              <textarea
              value={manualNumbers}
              onChange={(e) => setManualNumbers(e.target.value)}
              rows={10}
              placeholder={'P-1001-PID-001\nE-2004-SLD-014\nM-3012-GA-006'}
              className="w-full p-3 rounded-md border border-neutral-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0461BA]" />

            </div>
          }
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-200">
          <button onClick={onClose} className="h-9 px-4 rounded-md border border-neutral-200 text-sm hover:bg-neutral-50">{t('common.cancel')}</button>
          <button onClick={confirm} className="h-9 px-4 rounded-md bg-[#0461BA] text-white text-sm hover:bg-[#035299]">{t('packages.addToPackage')}</button>
        </div>
      </div>
    </div>);

}

// ---------- Detail ----------
function PackageDetail({
  pkg,
  onBack,
  onRepackage,
  onAction




}: {pkg: PackageObject;onBack: () => void;onRepackage: () => void;onAction: (msg: string) => void;}) {
  const { t } = useLocalization();
  const [tab, setTab] = useState<'overview' | 'contents' | 'versions' | 'changelog' | 'distribution' | 'activity'>('overview');

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-3">

        <ArrowLeftIcon size={14} /> {t('navigation.packages')}
      </button>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-mono text-xs text-neutral-500 mb-1">{pkg.reference}</div>
          <h1 className="text-2xl font-semibold text-neutral-900">{pkg.title}</h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-2xl">{pkg.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${statusStyles[pkg.status]}`}>
            {translatePackageStatus(t, pkg.status)}
          </span>
          <span className="font-mono text-xs px-2 py-1 bg-neutral-100 rounded">{t('packages.rev')} {pkg.revision}</span>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 mt-4 mb-4">
        <button onClick={onRepackage} className="h-8 px-3 rounded-md bg-[#0461BA] text-white text-sm hover:bg-[#035299] inline-flex items-center gap-1.5">
          <RefreshCwIcon size={14} /> {t('packages.repackage')}
        </button>
        <button onClick={() => onAction(t('packages.transmittalStarted'))} className="h-8 px-3 rounded-md border border-neutral-200 text-sm hover:bg-neutral-50 inline-flex items-center gap-1.5">
          <SendIcon size={14} /> {t('packages.issueTransmit')}
        </button>
        <button onClick={() => onAction(t('packages.downloadingPdf'))} className="h-8 px-3 rounded-md border border-neutral-200 text-sm hover:bg-neutral-50 inline-flex items-center gap-1.5">
          <DownloadIcon size={14} /> {t('packages.downloadPdf')}
        </button>
        <button onClick={() => onAction(t('packages.downloadingZip'))} className="h-8 px-3 rounded-md border border-neutral-200 text-sm hover:bg-neutral-50 inline-flex items-center gap-1.5">
          <FileArchiveIcon size={14} /> {t('packages.downloadZip')}
        </button>
        <button onClick={() => onAction(t('packages.shareLinkCopied'))} className="h-8 px-3 rounded-md border border-neutral-200 text-sm hover:bg-neutral-50">
          {t('packages.shareLink')}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 flex gap-1 mb-4">
        {([
        ['overview', t('packages.tabs.overview')],
        ['contents', t('packages.tabs.contents')],
        ['versions', t('packages.tabs.versions')],
        ['changelog', t('packages.tabs.changeLog')],
        ['distribution', t('packages.tabs.distribution')],
        ['activity', t('packages.tabs.activity')]] as const).
        map(([id, label]) =>
        <button
          key={id}
          onClick={() => setTab(id)}
          className={`px-4 py-2 text-sm border-b-2 -mb-px ${
          tab === id ?
          'border-[#0461BA] text-[#0461BA] font-medium' :
          'border-transparent text-neutral-500 hover:text-neutral-900'}`
          }>

            {label}
          </button>
        )}
      </div>

      {tab === 'overview' &&
      <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white border border-neutral-200 rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">{t('packages.metadata')}</h3>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-6 text-sm">
              <Meta k={t('packages.type')} v={pkg.type} />
              <Meta k={t('packages.discipline')} v={pkg.discipline} />
              <Meta k={t('packages.area')} v={pkg.area} />
              <Meta k={t('packages.owner')} v={pkg.owner} />
              <Meta k={t('packages.dueDate')} v={pkg.dueDate} />
              <Meta k={t('packages.documents')} v={String(pkg.documentCount)} />
              <Meta k={t('packages.lastGenerated')} v={pkg.lastGenerated} />
              <Meta k={t('packages.changeState')} v={translateChangeState(t, pkg.changeState)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className={`border rounded-lg p-4 ${pkg.changeState === 'Up to date' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                {pkg.changeState === 'Up to date' ?
              <CheckIcon size={16} className="text-emerald-600" /> :

              <AlertCircleIcon size={16} className="text-amber-600" />
              }
                {translateChangeState(t, pkg.changeState)}
              </div>
              <p className="text-xs text-neutral-600">
                {pkg.changeState === 'Up to date' ?
              t('packages.overviewStatusUpToDateDesc') :
              t('packages.overviewStatusOutOfDateDesc')}
              </p>
            </div>
            <div className="border border-neutral-200 rounded-lg p-4 bg-white text-sm">
              <div className="flex items-center gap-2 text-neutral-500 text-xs mb-2">
                <ClockIcon size={12} /> {t('packages.recent')}
              </div>
              <ul className="space-y-1.5 text-neutral-700 text-xs">
                <li>{t('packages.generatedByOwner', { owner: pkg.owner, revision: pkg.revision })}</li>
                <li>{t('packages.revisedInFolders')}</li>
                <li>{t('packages.transmittalIssued')}</li>
              </ul>
            </div>
          </div>
        </div>
      }

      {tab === 'contents' &&
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
              <tr>
                <th className="w-8"></th>
                <th className="text-left px-3 py-2.5 font-medium">{t('packages.documentNumber')}</th>
                <th className="text-left px-3 py-2.5 font-medium">{t('packages.title')}</th>
                <th className="text-left px-3 py-2.5 font-medium">{t('packages.rev')}</th>
                <th className="text-left px-3 py-2.5 font-medium">{t('packages.status')}</th>
                <th className="text-left px-3 py-2.5 font-medium">{t('packages.sourceFolder')}</th>
                <th className="text-left px-3 py-2.5 font-medium">{t('packages.render')}</th>
                <th className="text-left px-3 py-2.5 font-medium">{t('packages.included')}</th>
              </tr>
            </thead>
            <tbody>
              {pkg.documents.length === 0 &&
            <tr><td colSpan={8} className="p-8 text-center text-neutral-500">{t('packages.noDocumentsInPackage')}</td></tr>
            }
              {pkg.documents.map((d, i) =>
            <tr key={i} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60">
                  <td className="px-2 text-neutral-400"><GripVerticalIcon size={14} /></td>
                  <td className="px-3 py-2 font-mono text-xs">{d.number}</td>
                  <td className="px-3 py-2">{d.title}</td>
                  <td className="px-3 py-2 font-mono text-xs">{d.revision}</td>
                  <td className="px-3 py-2 text-neutral-600">{translatePackageStatus(t, d.status)}</td>
                  <td className="px-3 py-2 text-xs text-neutral-500">{d.sourceFolder}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${d.render ? 'bg-[#E8F1FB] border-[#BAD4EE] text-[#0461BA]' : 'bg-white border-neutral-200 text-neutral-500'}`}>
                      {d.render ? 'PDF' : t('packages.linkOnly')}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs ${d.include ? 'text-emerald-700' : 'text-neutral-400'}`}>
                      {d.include ? t('packages.included') : t('packages.excluded')}
                    </span>
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      }

      {tab === 'versions' &&
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">{t('packages.version')}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t('packages.generated')}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t('packages.by')}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t('packages.changeSummary')}</th>
                <th className="text-right px-4 py-2.5 font-medium">{t('packages.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pkg.versions.length === 0 &&
            <tr><td colSpan={5} className="p-8 text-center text-neutral-500">{t('packages.noVersions')}</td></tr>
            }
              {pkg.versions.map((v, i) =>
            <tr key={i} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">{v.version}</td>
                  <td className="px-4 py-2.5">{v.generatedDate}</td>
                  <td className="px-4 py-2.5 text-neutral-700">{v.generatedBy}</td>
                  <td className="px-4 py-2.5 text-neutral-600">{v.summary}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => onAction(t('packages.downloadingVersion', { version: v.version }))} className="text-[#0461BA] hover:underline text-xs inline-flex items-center gap-1">
                      <DownloadIcon size={12} /> {t('packages.downloadVersion')}
                    </button>
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      }

      {tab === 'changelog' &&
      <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">{t('packages.changesSinceLast')}</h3>
          {pkg.changeLog.length === 0 ?
        <p className="text-sm text-neutral-500">{t('packages.noChangesDetected')}</p> :

        <ul className="divide-y divide-neutral-100">
              {pkg.changeLog.map((c, i) =>
          <li key={i} className="py-2.5 flex items-start gap-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-medium w-32 text-center flex-shrink-0">
                    {c.type}
                  </span>
                  <span className="font-mono text-xs text-neutral-700 w-40 flex-shrink-0">{c.doc}</span>
                  <span className="text-sm text-neutral-600">{c.detail}</span>
                </li>
          )}
            </ul>
        }
        </div>
      }

      {tab === 'distribution' &&
      <div className="grid grid-cols-2 gap-4">
          <ActionCard
          icon={SendIcon}
          title={t('packages.sendViaTransmittal')}
          desc={t('packages.sendViaTransmittalDesc')}
          cta={t('packages.startTransmittal')}
          onClick={() => onAction(t('packages.transmittalStarted'))} />

          <ActionCard
          icon={GitIconLike}
          title={t('packages.startWorkflow')}
          desc={t('packages.startWorkflowDesc')}
          cta={t('packages.startWorkflowCta')}
          onClick={() => onAction(t('packages.workflowStarted'))} />

          <ActionCard
          icon={DownloadIcon}
          title={t('packages.downloadAsPdf')}
          desc={t('packages.downloadAsPdfDesc')}
          cta={t('packages.downloadPdf')}
          onClick={() => onAction(t('packages.downloadingPdf'))} />

          <ActionCard
          icon={FileArchiveIcon}
          title={t('packages.downloadAsZip')}
          desc={t('packages.downloadAsZipDesc')}
          cta={t('packages.downloadZip')}
          onClick={() => onAction(t('packages.downloadingZip'))} />

          <ActionCard
          icon={FileTextIcon}
          title={t('packages.sharePackageLink')}
          desc={t('packages.sharePackageLinkDesc')}
          cta={t('packages.copyLink')}
          onClick={() => onAction(t('packages.shareLinkCopied'))} />

        </div>
      }

      {tab === 'activity' &&
      <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <ul className="space-y-3 text-sm">
            <ActivityItem who={pkg.owner} what={t('packages.generatedRevision', { revision: pkg.revision })} when={pkg.lastGenerated} />
            <ActivityItem who={t('packages.system')} what={t('packages.detectedRevisions')} when="2 days ago" />
            <ActivityItem who="Mark Doyle" what={t('packages.addedDocuments')} when="3 days ago" />
            <ActivityItem who="Sarah Chen" what={t('packages.createdPackage')} when="2026-02-02" />
          </ul>
        </div>
      }
    </div>);

}

function Meta({ k, v }: {k: string;v: string;}) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{k}</div>
      <div className="text-sm text-neutral-900">{v}</div>
    </div>);

}

function ActionCard({
  icon: Icon, title, desc, cta, onClick




}: {icon: React.ElementType;title: string;desc: string;cta: string;onClick: () => void;}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-[#E8F1FB] text-[#0461BA] flex items-center justify-center flex-shrink-0">
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-neutral-900">{title}</h4>
          <p className="text-xs text-neutral-500 mt-1 mb-3">{desc}</p>
          <button onClick={onClick} className="h-8 px-3 rounded-md border border-neutral-200 text-sm hover:bg-neutral-50">
            {cta}
          </button>
        </div>
      </div>
    </div>);

}

function GitIconLike(props: any) {
  return <CheckIcon {...props} />;
}

function ActivityItem({ who, what, when }: {who: string;what: string;when: string;}) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 flex-shrink-0">
        <UserIcon size={13} />
      </div>
      <div className="text-sm">
        <span className="font-medium text-neutral-900">{who}</span>{' '}
        <span className="text-neutral-600">{what}</span>
        <div className="text-xs text-neutral-400">{when}</div>
      </div>
    </li>);

}

