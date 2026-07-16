// ProjectMapView — Dashboard map (Leaflet), available in both enterprise and
// project scope. Enterprise: one pin per workspace over the full WA extent.
// Project scope passes focusedProjectId — the map renders only that pin, zooms
// to it (zoom 8) and auto-opens its popup. Hovering a pin opens a summary popup
// whose contents deep-link into the app: title/"Open project" selects that
// workspace in the banner scope, Documents jumps to the document browser, Flint
// opens chat — all with the project as context.
//
// Two basemaps, switched by an in-map toggle (persisted via useUserPref):
//   'map'    — OpenStreetMap standard raster tiles (default).
//   'hybrid' — Esri World Imagery satellite as the base, with Esri's transparent
//              reference overlays (transportation = roads, boundaries & places =
//              city/place labels) composited on top. All tile sources below are
//              free and require no API key.
//
// [TODO-ENG] If strictly-OSM road/label data is required for the hybrid overlay,
//   the Esri reference layers can be swapped for a keyed OSM provider (Stadia,
//   Thunderforest, MapTiler) — there is no free, key-free transparent OSM
//   roads+labels overlay. URLs are named constants (TILE_LAYERS) for that swap.
//
// [MOCK] Pin data derives from PROJECTS + the per-project mock sets.
// [API] G03:GET /workspaces — workspace list; popup stats come from G06 counts + G13 unread
// [AUTH]
// [TBD] Workspace geo metadata (lat/lng/locality) is not in the current G03 draft.
// [TODO-ENG] Confirm where project location data lives — G03 workspace attributes or G16 metadata schema.
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { FolderIcon, FileTextIcon, AlertCircleIcon, BellIcon, ArrowRightIcon, EyeIcon, MapIcon, LayersIcon, MapPinIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { PROJECTS } from '../data/projects';
import { mockDocumentsByProject } from '../data/mockDocuments';
import { mockTodos, mockNotifications } from '../data/mockDashboard';
import { useScope } from '../contexts/ScopeContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { useUserPref } from '../hooks/useUserPref';
import { FlintIcon } from './FlintIcon';

// Tile sources — all free, no API key. Esri imagery + reference overlays compose
// the hybrid basemap; the reference layers are transparent PNGs (just roads /
// labels) designed to sit over imagery. Esri tile paths use {z}/{y}/{x} order.
const TILE_LAYERS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community',
  },
  // Transparent overlay: roads / transportation network.
  roads: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
  },
  // Transparent overlay: place names, city labels and boundaries.
  labels: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  },
} as const;

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

interface ProjectMapViewProps {
  focusedProjectId?: (typeof PROJECTS)[number]['id'] | null;
}

type Project = (typeof PROJECTS)[number];

function statsFor(projectId: (typeof PROJECTS)[number]['id'], projectName: string): ProjectPinStats {
  const docs = mockDocumentsByProject[projectId];
  return {
    documents: docs.length,
    inReview: docs.filter((d) => d.status === 'Under Review').length,
    overdue: mockTodos.filter((t) => t.project === projectName && t.status === 'Overdue').length,
    unread: mockNotifications.filter((n) => n.project === projectName && !n.isRead).length,
  };
}

function MapViewportController({ focusedProjectId }: { focusedProjectId?: (typeof PROJECTS)[number]['id'] | null }) {
  const map = useMap();

  useEffect(() => {
    if (focusedProjectId) {
      const focusedProject = PROJECTS.find((project) => project.id === focusedProjectId);
      if (focusedProject) {
        map.setView([focusedProject.location.lat, focusedProject.location.lng], 8, { animate: true });
        return;
      }
    }

    map.fitBounds(WA_BOUNDS, { padding: [28, 28] });
  }, [focusedProjectId, map]);

  return null;
}

// Right-click anywhere on the map opens a small menu to copy that point's
// coordinates. `containerPoint` is relative to the map element, which is the
// same size/origin as the wrapper, so it doubles as the menu's pixel position.
interface MapContextMenuState {
  x: number;
  y: number;
  lat: number;
  lng: number;
}

function MapContextMenuController({
  onOpen,
  onClose,
}: {
  onOpen: (menu: MapContextMenuState) => void;
  onClose: () => void;
}) {
  useMapEvents({
    contextmenu(e) {
      // Suppress the browser's native context menu so ours is the only one.
      e.originalEvent.preventDefault();
      const size = e.target.getSize();
      // Keep the menu inside the map bounds (approx menu size 220×96).
      const x = Math.min(Math.max(e.containerPoint.x, 4), Math.max(4, size.x - 224));
      const y = Math.min(Math.max(e.containerPoint.y, 4), Math.max(4, size.y - 100));
      onOpen({ x, y, lat: e.latlng.lat, lng: e.latlng.lng });
    },
    // Any map interaction dismisses an open menu.
    movestart: onClose,
    zoomstart: onClose,
    click: onClose,
  });

  return null;
}

export function ProjectMapView({ focusedProjectId = null }: ProjectMapViewProps) {
  const { setScope } = useScope();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  // Basemap choice persists like the other dashboard map prefs.
  const [basemap, setBasemap] = useUserPref<'map' | 'hybrid'>('dashboard.mapBasemap', 'map');
  // Right-click "copy coordinates" menu (transient — not persisted).
  const [contextMenu, setContextMenu] = useState<MapContextMenuState | null>(null);
  const [coordsCopied, setCoordsCopied] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const closeContextMenu = () => {
    setContextMenu(null);
    setCoordsCopied(false);
  };

  // Dismiss the menu on Escape or an outside click (map interactions are handled
  // by MapContextMenuController). Only attached while the menu is open.
  useEffect(() => {
    if (!contextMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextMenu();
    };
    const onPointer = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [contextMenu]);

  const copyCoordinates = async () => {
    if (!contextMenu) return;
    const text = `${contextMenu.lat.toFixed(6)}, ${contextMenu.lng.toFixed(6)}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts where the Clipboard API is unavailable.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* no-op */ }
      document.body.removeChild(ta);
    }
    setCoordsCopied(true);
    window.setTimeout(closeContextMenu, 900);
  };

  const projectsToRender = useMemo<readonly Project[]>(() => {
    if (!focusedProjectId) {
      return PROJECTS;
    }
    return PROJECTS.filter((project) => project.id === focusedProjectId);
  }, [focusedProjectId]);

  useEffect(() => {
    if (!focusedProjectId) {
      return;
    }

    const marker = markerRefs.current[focusedProjectId];
    if (!marker) {
      return;
    }

    // Open the focused project's popup automatically in single-project mode.
    marker.openPopup();
  }, [focusedProjectId, projectsToRender]);

  const selectProject = (project: Project) =>
    setScope({ kind: 'project', id: project.id, name: project.name });

  return (
    <div className="relative h-full w-full">
      <MapContainer
        bounds={WA_BOUNDS}
        scrollWheelZoom
        className="h-full w-full"
        aria-label="Project locations map"
      >
        <MapViewportController focusedProjectId={focusedProjectId} />
        <MapContextMenuController onOpen={(menu) => { setCoordsCopied(false); setContextMenu(menu); }} onClose={closeContextMenu} />
        {basemap === 'hybrid' ? (
          // Satellite base + transparent roads + transparent labels, bottom→top.
          // Distinct keys force a clean layer swap when the basemap toggles.
          <>
            <TileLayer key="sat" url={TILE_LAYERS.satellite.url} attribution={TILE_LAYERS.satellite.attribution} zIndex={1} />
            <TileLayer key="roads" url={TILE_LAYERS.roads.url} zIndex={2} />
            <TileLayer key="labels" url={TILE_LAYERS.labels.url} zIndex={3} />
          </>
        ) : (
          <TileLayer key="osm" url={TILE_LAYERS.osm.url} attribution={TILE_LAYERS.osm.attribution} />
        )}
        {projectsToRender.map((project) => {
        const stats = statsFor(project.id, project.name);
        return (
          <Marker
            key={project.id}
            position={[project.location.lat, project.location.lng]}
            icon={pinIcon}
            ref={(marker) => {
              markerRefs.current[project.id] = marker;
            }}
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

      {/* Basemap toggle — overlaid top-right, above Leaflet panes. Sibling of the
          map (not a child), so wheel/click events never reach the map handlers.
          The page-level `relative z-0` wrapper keeps this under the top banner. */}
      <div
        role="group"
        aria-label={t('dashboard.basemapToggle')}
        className="absolute top-3 right-3 z-[1000] inline-flex rounded-lg border border-neutral-200 bg-white/95 p-0.5 shadow-md backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={() => setBasemap('map')}
          aria-pressed={basemap === 'map'}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
            basemap === 'map' ? 'bg-[#0461BA] text-white shadow-sm' : 'text-neutral-600 hover:bg-[#F0F4F8]'
          }`}
        >
          <MapIcon size={13} />
          {t('dashboard.basemapMap')}
        </button>
        <button
          type="button"
          onClick={() => setBasemap('hybrid')}
          aria-pressed={basemap === 'hybrid'}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
            basemap === 'hybrid' ? 'bg-[#0461BA] text-white shadow-sm' : 'text-neutral-600 hover:bg-[#F0F4F8]'
          }`}
        >
          <LayersIcon size={13} />
          {t('dashboard.basemapHybrid')}
        </button>
      </div>

      {/* Right-click coordinate menu — positioned at the clicked map point.
          z above the basemap toggle; still contained under the banner by the
          page-level `relative z-0` wrapper. */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          role="menu"
          aria-label={t('dashboard.copyCoords')}
          className="absolute z-[1100] w-[220px] rounded-lg border border-neutral-200 bg-white shadow-xl overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="flex items-start gap-2 px-3 py-2 border-b border-neutral-100">
            <MapPinIcon size={13} className="mt-0.5 shrink-0 text-[#0461BA]" />
            <span className="text-[11px] leading-snug text-neutral-700 tabular-nums">
              {contextMenu.lat.toFixed(6)}, {contextMenu.lng.toFixed(6)}
            </span>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={copyCoordinates}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-[#E8F1FB] hover:text-[#0461BA] transition-colors"
          >
            {coordsCopied ? (
              <>
                <CheckIcon size={13} className="text-green-600" />
                {t('dashboard.coordsCopied')}
              </>
            ) : (
              <>
                <CopyIcon size={13} />
                {t('dashboard.copyCoords')}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
