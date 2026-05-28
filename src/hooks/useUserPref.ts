import { useCallback, useEffect, useState } from 'react';

/**
 * useUserPref — lightweight user preference hook.
 *
 * CURRENT IMPLEMENTATION: localStorage, keyed by `prefKey`.
 * Preferences are stored as JSON under the key `flux.userPref.<prefKey>`.
 *
 * ─── TODO: Oracle / FusionLive API integration ───────────────────────────────
 * When the user-preferences table is available in the FusionLive Oracle
 * database, replace the localStorage read/write below with:
 *
 *   GET  /api/user/preferences/:prefKey        → initial value on mount
 *   POST /api/user/preferences/:prefKey        → persist on change
 *         body: { value: <serialised JSON> }
 *
 * The hook signature and call-sites in components do NOT need to change —
 * only the internals of this file.  Consider adding an optimistic-update
 * strategy (write locally first, sync in background) to keep the UI snappy.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const STORAGE_PREFIX = 'flux.userPref.';

function readPref<T>(prefKey: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + prefKey);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function writePref<T>(prefKey: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + prefKey, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or private-browsing restriction — fail silently.
  }
}

/**
 * Usage:
 *   const [historyOpen, setHistoryOpen] = useUserPref('chat.historyOpen', false);
 *
 * @param prefKey   Dot-namespaced key, e.g. 'chat.historyOpen'.
 *                  Will map to the preference column name when the Oracle API
 *                  is wired up.
 * @param defaultValue  Used when no stored preference exists for this user.
 */
export function useUserPref<T>(prefKey: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValueState] = useState<T>(() => readPref(prefKey, defaultValue));

  // Persist every change to localStorage (and eventually to the Oracle API).
  useEffect(() => {
    writePref(prefKey, value);
    // TODO: also call POST /api/user/preferences/:prefKey here once the
    //       FusionLive Oracle preferences endpoint is available.
  }, [prefKey, value]);

  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    setValueState((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      return resolved;
    });
  }, []);

  return [value, setValue];
}
