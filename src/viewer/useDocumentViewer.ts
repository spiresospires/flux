// useDocumentViewer — owns the lifecycle of ONE open document against
// whichever ViewerBackend is active (see selectViewerBackend.ts).
//
// `DocumentViewer.tsx` is the only intended consumer. It is the single place
// FLUX renders the actual document surface, as distinct from ViewerContext
// (contexts/ViewerContext.tsx), which is the open/closed DECLARATIVE state
// every "open this document" call site uses (the grid, the properties panel,
// the version stack).
//
// Keep these two separate:
//   - ViewerContext answers "what SHOULD be open" (`target`, `isMaximised`).
//     It must stay exactly as it is today — VersionStack.test.tsx mocks it
//     with a hand-written object literal, so any new field added there is
//     `undefined` in that test with no type error, silently.
//   - This hook answers "is it actually open, loading, or broken, and what
//     has the backend told us" (`status`, `error`, `markups`, `comments`).
//     New surface area belongs HERE, not on ViewerContext.
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { selectViewerBackend } from './selectViewerBackend';
import type {
  ViewerBackend,
  ViewerSessionCallbacks,
  ViewerSessionHandle,
  ViewerSessionStatus,
} from './viewerBackend';
import type { ViewerComment, ViewerMarkup, ViewerTarget } from '../types/viewer';

export interface UseDocumentViewerOptions {
  /** Called when the ACTIVE BACKEND asks FLUX to close the viewer. Only
   *  fires for an 'external' presentation backend (the native Apryse
   *  handoff — see viewerBackend.ts): FLUX renders no chrome of its own
   *  around that backend, so this callback is the only way it learns the
   *  user is done. Wire it to the same close handler as FLUX's own X button
   *  (ViewerContext's `closeViewer`) so both paths converge on one place. */
  onRequestClose: () => void;
}

export interface UseDocumentViewerResult {
  backend: ViewerBackend;
  /** Attach to the DOM node a 'surface' backend should mount into (e.g. where
   *  Apryse WebViewer would be constructed). Meaningless for an 'external'
   *  backend — check `backend.presentation` before rendering a host div at
   *  all, since an 'external' backend needs no on-screen surface. */
  hostRef: RefObject<HTMLDivElement>;
  status: ViewerSessionStatus;
  error: Error | undefined;
  markups: ViewerMarkup[];
  comments: ViewerComment[];
  /** Re-opens the current target from scratch. No-op when nothing is open.
   *  Exists so an 'error' status can offer a retry affordance. */
  retry: () => void;
}

export function useDocumentViewer(
  target: ViewerTarget | null,
  { onRequestClose }: UseDocumentViewerOptions
): UseDocumentViewerResult {
  // One backend instance for the life of this hook. Selected once —
  // deliberately NOT re-evaluated per render or per target, because which
  // backend is active depends on the environment FLUX is running in (see
  // selectViewerBackend.ts), not on which document happens to be open.
  const backendRef = useRef<ViewerBackend | null>(null);
  if (!backendRef.current) backendRef.current = selectViewerBackend();
  const backend = backendRef.current;

  const hostRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<ViewerSessionStatus>('idle');
  const [error, setError] = useState<Error | undefined>(undefined);
  const [markups, setMarkups] = useState<ViewerMarkup[]>([]);
  const [comments, setComments] = useState<ViewerComment[]>([]);

  // Read via a ref rather than depending on it directly: callers are not
  // required to memoise `onRequestClose` (ViewerContext's `closeViewer`
  // happens to be useCallback-wrapped today, but this hook shouldn't assume
  // every future caller does the same), and a session must not be torn down
  // and reopened just because the caller re-rendered with a new closure.
  const onRequestCloseRef = useRef(onRequestClose);
  onRequestCloseRef.current = onRequestClose;

  // A session reopens when the CONTENT identity changes — not when the
  // `target` object reference changes. The same document at a different
  // revision (opened from the Version Stack, see VersionStack.tsx) must
  // reload; re-rendering with an equivalent target must not. Mirrors the
  // existing care in DocumentViewer.tsx's zoom-reset effect, which keys on
  // `target?.docId` for the same reason (see its comment there).
  const contentKey = target ? `${target.docId}::${target.revision ?? ''}` : null;

  // The effect below depends only on `contentKey`; it reads the actual
  // target out of this ref so an incidental new `target` literal carrying
  // the same content key doesn't restart the session.
  const targetRef = useRef(target);
  targetRef.current = target;

  // Bumped by `retry()` to force the effect to re-run against the SAME
  // contentKey — retrying doesn't change what's open, so it can't be
  // expressed as a contentKey change.
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    const currentTarget = targetRef.current;

    if (!currentTarget) {
      setStatus('idle');
      setError(undefined);
      setMarkups([]);
      setComments([]);
      return;
    }

    // Reset display state up front so the PREVIOUS document's markups/
    // comments never flash while the next one is still loading.
    setStatus('initializing');
    setError(undefined);
    setMarkups([]);
    setComments([]);

    let cancelled = false;
    let sessionHandle: ViewerSessionHandle | undefined;

    const callbacks: ViewerSessionCallbacks = {
      onStatusChange: (nextStatus, nextError) => {
        if (cancelled) return;
        setStatus(nextStatus);
        setError(nextError);
      },
      onMarkupsChange: (nextMarkups) => {
        if (cancelled) return;
        setMarkups(nextMarkups);
      },
      onCommentsChange: (nextComments) => {
        if (cancelled) return;
        setComments(nextComments);
      },
      onRequestClose: () => onRequestCloseRef.current(),
    };

    backend
      .init({})
      .then(() => {
        if (cancelled) return;
        sessionHandle = backend.open(
          currentTarget,
          backend.presentation === 'surface' ? (hostRef.current ?? undefined) : undefined,
          callbacks
        );
      })
      .catch((initError: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setError(initError instanceof Error ? initError : new Error(String(initError)));
      });

    return () => {
      cancelled = true;
      sessionHandle?.close();
    };
    // contentKey is the deliberate re-open trigger (see its comment above);
    // targetRef/onRequestCloseRef sidestep needing `target`/`onRequestClose`
    // as dependencies without them going stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, retryNonce, backend]);

  const retry = useCallback(() => setRetryNonce((n) => n + 1), []);

  return { backend, hostRef, status, error, markups, comments, retry };
}
