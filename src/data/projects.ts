export const PROJECTS = [
  { id: 'shard', name: 'The Shard, London' },
  { id: 'skyline', name: 'Skyline' },
  { id: 'tower', name: 'Tower' },
  { id: 'empire', name: 'Empire State' },
] as const;

export type ProjectId = typeof PROJECTS[number]['id'];
