// [MOCK] Static project list — single source of truth for all mock data.
// [API] G03:GET /workspaces
// [AUTH]
// [PHASE-1]
// Replace PROJECTS with the useWorkspaces() React Query hook (see ARCHITECTURE.md
// §Scope / Workspace Selector). `id` maps directly to the `wsId` path parameter used
// by every workspace-scoped endpoint.
//
// Theme: Western Australian mining EPC portfolio — four projects with deliberately
// different asset types (mine / port / process plant / rail) so each workspace has
// a distinct folder structure, document set and dashboard profile.

export interface ProjectLocation {
  readonly lat: number;
  readonly lng: number;
  readonly locality: string;
}

interface Project {
  readonly id: 'marra-ridge' | 'hedland' | 'kwinana' | 'goldfields';
  readonly name: string;
  /** Owner/operator shown on the map popup — matches the client logos in src/assets/logos. */
  readonly client: string;
  readonly assetType: string;
  readonly phase: 'Engineering' | 'Construction' | 'Commissioning' | 'Operations';
  readonly location: ProjectLocation;
  /** When true, this project shows the FLUX refactor four-option view-style picker */
  readonly isFluxRefactor?: true;
}

export const PROJECTS: readonly Project[] = [
  {
    id: 'marra-ridge',
    name: 'Marra Ridge Iron Ore Mine',
    client: 'Iluka Resources',
    assetType: 'Iron Ore Mine',
    phase: 'Construction',
    location: { lat: -22.74, lng: 119.25, locality: 'Pilbara, WA' },
  },
  {
    id: 'hedland',
    name: 'Port Hedland Berth 6 Expansion',
    client: 'Clough',
    assetType: 'Port Infrastructure',
    phase: 'Construction',
    location: { lat: -20.312, lng: 118.578, locality: 'Port Hedland, WA' },
    isFluxRefactor: true,
  },
  {
    id: 'kwinana',
    name: 'Kwinana Lithium Hydroxide Plant',
    client: 'Twinza',
    assetType: 'Process Plant',
    phase: 'Commissioning',
    location: { lat: -32.239, lng: 115.77, locality: 'Kwinana, WA' },
  },
  {
    id: 'goldfields',
    name: 'Goldfields Rail Duplication',
    client: 'Rosetti Marino',
    assetType: 'Rail Infrastructure',
    phase: 'Engineering',
    location: { lat: -30.749, lng: 121.466, locality: 'Kalgoorlie, WA' },
  },
];

export type ProjectId = Project['id'];
