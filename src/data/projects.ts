interface Project {
  readonly id: 'shard' | 'skyline' | 'tower' | 'empire';
  readonly name: string;
  /** When true, this project shows the FLUX refactor four-option view-style picker */
  readonly isFluxRefactor?: true;
}

export const PROJECTS: readonly Project[] = [
  { id: 'shard', name: 'The Shard, London' },
  { id: 'skyline', name: 'Skyline', isFluxRefactor: true },
  { id: 'tower', name: 'Tower' },
  { id: 'empire', name: 'Empire State' },
];

export type ProjectId = Project['id'];
