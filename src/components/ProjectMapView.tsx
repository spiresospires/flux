// ProjectMapView — enterprise Dashboard map (OpenStreetMap tiles via Leaflet).
// Shows one pin per project workspace; hovering a pin opens a summary popup whose
// contents deep-link into the app: title/"Open project" selects that workspace in
// the banner scope, Documents jumps to the document browser, Flint opens chat —
// all with the project as context.
//
// [MOCK] Pin data derives from PROJECTS + the per-project mock sets.
// [API] G03:GET /workspaces — workspace list; popup stats come from G06 counts + G13 unread
// [AUTH]
// [TBD] Workspace geo metadata (lat/lng/locality) is not in the current G03 draft.
// [TODO-ENG] Confirm where project location data lives — G03 workspace attributes or G16 metadata schema.
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { FolderIcon, FileTextIcon, AlertCircleIcon, BellIcon, ArrowRightIcon, EyeIcon } from 'lucide-react';
import { PROJECTS } from '../data/projects';
import { mockDocumentsByProject } from '../data/mockDocuments';
import { mockTodos, mockNotifications } from '../data/mockDashboard';
import { useScope } from '../contexts/ScopeContext';
import { FlintIcon } from './FlintIcon';

// Brand-blue teardrop pin as a divIcon — avoids Leaflet's default marker PNG
// asset paths, which break under Vite without extra config.
const pinIcon = L.divIcon({
  className: '', // suppress Leaflet's default divIcon box styling
  html: `
    <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35))">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11.2 15 25 15 25s15-13.8 15-25C30 6.7 23.3 0 15 0z" fill="#0461BA"/>
      <circle cx="15" cy="14" r="6" fill="white"/>
    </svg>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -38],
});

// Covers all four WA pins (Pilbara down to Kwinana, west coast to Kalgoorlie).
const WA_BOUNDS: L.LatLngBoundsExpression = [
  [-33.6, 114.0],
  [-19.2, 123.0],
];

interface ProjectPinStats {
  documents: number;
  inReview: number;
  overdue: number;
  unread: number;
}

function statsFor(projectId: (typeof PROJECTS)[number]['id'], projectName: string): ProjectPinStats {
  const docs = mockDocumentsByProject[projectId];
  return {
    documents: docs.length,
    inReview: docs.filter((d) => d.status === 'In Review').length,
    overdue: mockTodos.filter((t) => t.project === projectName && t.status === 'Overdue').length,
    unread: mockNotifications.filter((n) => n.project === projectName && !n.isRead).length,
  };
}

export function ProjectMapView() {
  const { setScope } = useScope();
  const navigate = useNavigate();

  const selectProject = (project: (typeof PROJECTS)[number]) =>
    setScope({ kind: 'project', id: project.id, name: project.name });

  return (
    <MapContainer
      bounds={WA_BOUNDS}
      scrollWheelZoom
      className="h-full w-full"
      aria-label="Project locations map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {PROJECTS.map((project) => {
        const stats = statsFor(project.id, project.name);
        return (
          <Marker
            key={project.id}
            position={[project.location.lat, project.location.lng]}
            icon={pinIcon}
            // Hover opens the popup; it stays open (clickable) until another pin
            // opens or the map is clicked. Click also opens it for touch devices.
            eventHandlers={{ mouseover: (e) => e.target.openPopup() }}
            alt={project.name}
          >
            <Popup closeButton={false} className="project-map-popup" minWidth={260} maxWidth={280}>
              <div className="font-sans">
                {/* Title — clicking selects the workspace and shows its dashboard */}
                <button
                  type="button"
                  onClick={() => selectProject(project)}
                  className="text-left text-sm font-semibold text-[#0461BA] hover:underline leading-snug"
                >
                  {project.name}
                </button>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {project.client} · {project.assetType} · {project.location.locality}
                </p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F1FB] text-[#0461BA]">
                  {project.phase}
                </span>

                {/* Summary stats */}
                <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-neutral-700">
                  <span className="inline-flex items-center gap-1.5">
                    <FileTextIcon size={12} className="text-neutral-400" />
                    {stats.documents.toLocaleString()} documents
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <EyeIcon size={12} className="text-neutral-400" />
                    {stats.inReview} in review
                  </span>
                  <span className={`inline-flex items-center gap-1.5 ${stats.overdue > 0 ? 'text-red-600 font-medium' : ''}`}>
                    <AlertCircleIcon size={12} className={stats.overdue > 0 ? 'text-red-500' : 'text-neutral-400'} />
                    {stats.overdue} overdue
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BellIcon size={12} className="text-neutral-400" />
                    {stats.unread} unread
                  </span>
                </div>

                {/* Deep links — each selects the project first, then navigates */}
                <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { selectProject(project); navigate('/documents'); }}
                    title={`Open ${project.name} documents`}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-neutral-700 hover:bg-[#E8F1FB] hover:text-[#0461BA] transition-colors"
                  >
                    <FolderIcon size={13} className="text-amber-400" />
                    Documents
                  </button>
                  <button
                    type="button"
                    // Chat context travels via ?ask=<label>&askKind=project — Chat.tsx
                    // renders it as a visible context chip and scopes the conversation.
                    // [API] G29 (chat/assistant): context payload becomes
                    //       { scope: { wsId }, context: { type: 'project', id: wsId } } [TBD]
                    onClick={() => { selectProject(project); navigate(`/chat?ask=${encodeURIComponent(project.name)}&askKind=project`); }}
                    title={`Ask Flint about ${project.name}`}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-neutral-700 hover:bg-[#E8F1FB] hover:text-[#0461BA] transition-colors"
                  >
                    <FlintIcon isHovered={false} size={14} />
                    Flint
                  </button>
                  <button
                    type="button"
                    onClick={() => selectProject(project)}
                    title={`Switch workspace to ${project.name}`}
                    className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-white bg-[#0461BA] hover:bg-[#034f97] transition-colors"
                  >
                    Open
                    <ArrowRightIcon size={12} />
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
