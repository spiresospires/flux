// [MOCK] MSW browser worker — started from src/index.tsx before React renders.
// Delete (or leave gated behind VITE_API_MODE) when the Spring Boot API exists.
// [PHASE-1]
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
