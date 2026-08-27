import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase, getSession, loadProfile, createProfile, saveProfile, mergeRulePatch, RULE_COLUMNS } from './supabase.js';

const ProfileContext = createContext(null);

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>');
  return ctx;
}

export function ProfileProvider({ children }) {
  const [status, setStatus] = useState('loading'); // loading | unauthenticated | need-name | ready | error
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [defaultName, setDefaultName] = useState('');
  const [googleAvatar, setGoogleAvatar] = useState(null);
  const saveTimer = useRef(null);
  const maxTimer = useRef(null);
  const pendingPatch = useRef({});
  const currentUserId = useRef(null);
  // For the rule-column 3-way merge: `syncedRef` = last values confirmed synced
  // with the DB (the merge baseline); `latestRef` = this session's current
  // in-memory profile. Both are kept up to date as the profile loads and saves.
  const syncedRef = useRef(null);
  const latestRef = useRef(null);
  const setSynced = (p) => { syncedRef.current = p; latestRef.current = p; };

  useEffect(() => {
    let cancelled = false;

    // Safety net: if anything below hangs (e.g. broken cached SW / blocked storage),
    // never strand the user on the splash — drop them on the login screen instead.
    const loadingFallback = setTimeout(() => {
      if (cancelled) return;
      setStatus((s) => (s === 'loading' ? 'unauthenticated' : s));
    }, 4000);

    const withTimeout = (promise, ms, tag) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout:' + tag)), ms)),
      ]);

    const handleSession = async (session) => {
      try {
        if (!session) {
          currentUserId.current = null;
          if (!cancelled) {
            setGoogleAvatar(null);
            setStatus('unauthenticated');
          }
          return;
        }
        if (!cancelled) setStatus('loading');
        const meta = session.user?.user_metadata ?? {};
        if (!cancelled) setGoogleAvatar(meta.avatar_url || meta.picture || null);
        const p = await withTimeout(loadProfile(), 6000, 'loadProfile');
        if (cancelled) return;
        if (p) {
          currentUserId.current = session.user?.id ?? null;
          setSynced(p);
          setProfile(p);
          setStatus('ready');
        } else {
          // No "hero name" step: create the profile silently with a name
          // derived from the Google/email identity and land the user as ready.
          const suggested =
            meta.full_name || meta.name || (session.user?.email?.split('@')[0]) || 'Usuario';
          setDefaultName(suggested);
          try {
            const created = await withTimeout(createProfile(suggested), 6000, 'createProfile');
            if (cancelled) return;
            currentUserId.current = session.user?.id ?? null;
            setSynced(created);
            setProfile(created);
            setStatus('ready');
          } catch (e) {
            console.error('auto profile create failed', e);
            // Possibly created concurrently by a duplicate auth event — try once more.
            try {
              const again = await loadProfile();
              if (cancelled) return;
              if (again) {
                currentUserId.current = session.user?.id ?? null;
                setSynced(again);
                setProfile(again);
                setStatus('ready');
                return;
              }
            } catch {}
            if (!cancelled) setStatus('unauthenticated');
          }
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          // On any error during session/profile load, send the user to login
          // rather than a dead-end error screen — they can sign in again from there.
          setStatus('unauthenticated');
        }
      }
    };

    (async () => {
      try {
        const session = await getSession();
        await handleSession(session);
      } catch (e) {
        console.error(e);
        if (!cancelled) setStatus('unauthenticated');
      } finally {
        clearTimeout(loadingFallback);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Skip events that don't change identity — TOKEN_REFRESHED fires on tab
      // refocus and would otherwise flip us through 'loading' → 'ready', which
      // remounts the whole tree and wipes in-progress UI state (study session
      // index, open deck, etc). USER_UPDATED and INITIAL_SESSION are also
      // already handled by the getSession() bootstrap above. SIGNED_IN also
      // fires on tab refocus when Supabase re-validates the cached session;
      // ignore it when the session is for the same user we already loaded.
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_IN' && session?.user?.id && session.user.id === currentUserId.current) return;
      handleSession(session);
    });

    return () => {
      cancelled = true;
      clearTimeout(loadingFallback);
      sub.subscription.unsubscribe();
    };
  }, []);

  const submitName = async (name) => {
    try {
      const p = await createProfile(name);
      setSynced(p);
      setProfile(p);
      setStatus('ready');
    } catch (e) {
      console.error(e);
      setError(e.message || String(e));
      setStatus('error');
    }
  };

  const flushNow = () => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    if (maxTimer.current) { clearTimeout(maxTimer.current); maxTimer.current = null; }
    const toSave = pendingPatch.current;
    if (!toSave || Object.keys(toSave).length === 0) return;
    pendingPatch.current = {};

    // Rule columns go through a 3-way merge against the row's live value so a
    // stale session can't clobber rules another session added; everything else
    // saves as a plain patch.
    const touchesRules = RULE_COLUMNS.some((k) => k in toSave);
    const build = touchesRules
      ? mergeRulePatch(toSave, syncedRef.current, latestRef.current)
      : Promise.resolve(toSave);

    return build
      .catch((e) => {
        // If fetching the live rules for the merge fails, fall back to the plain
        // patch rather than dropping the save entirely.
        console.error('rule merge failed, saving local copy', e);
        return toSave;
      })
      .then((patch) => saveProfile(patch))
      .then((saved) => {
        if (!saved) return;
        // The saved row is the merged truth. Advance the sync baseline, and if no
        // newer rule edit is already queued, reflect merged rule columns into the
        // UI so rules added elsewhere show up (without clobbering in-flight edits).
        syncedRef.current = saved;
        const rulePending = RULE_COLUMNS.some((k) => k in pendingPatch.current);
        if (touchesRules && !rulePending) {
          setProfile((curr) => {
            const next = { ...curr };
            for (const k of RULE_COLUMNS) next[k] = saved[k];
            latestRef.current = next;
            return next;
          });
        } else {
          latestRef.current = { ...latestRef.current, ...saved };
        }
      })
      .catch((e) => {
        console.error('save failed', e);
        // Keep the unsaved changes pending (newer edits win) so the next
        // edit/flush retries them instead of dropping them.
        pendingPatch.current = { ...toSave, ...pendingPatch.current };
      });
  };

  const update = (patchOrFn) => {
    setProfile((curr) => {
      const patch = typeof patchOrFn === 'function' ? patchOrFn(curr) : patchOrFn;
      pendingPatch.current = { ...pendingPatch.current, ...patch };
      const next = { ...curr, ...patch };
      latestRef.current = next;
      return next;
    });
    // Idle debounce: save 600ms after the last change…
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushNow, 600);
    // …but never wait longer than 2.5s while changes keep coming (e.g. fast
    // swiping/grading through study cards), so a reload or tab close can't drop
    // a whole run of unsaved edits.
    if (!maxTimer.current) {
      maxTimer.current = setTimeout(flushNow, 2500);
    }
  };

  // Flush pending changes when the tab is hidden or the page is unloading —
  // covers navigating away, closing, and the service-worker update reload that
  // fires on refocus (window.location.reload in main.jsx). Without this the
  // trailing debounced save is lost on every such transition.
  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'hidden') flushNow(); };
    window.addEventListener('pagehide', flushNow);
    window.addEventListener('lr:flush-save', flushNow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flushNow);
      window.removeEventListener('lr:flush-save', flushNow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ProfileContext.Provider value={{ status, profile, error, defaultName, googleAvatar, submitName, update }}>
      {children}
    </ProfileContext.Provider>
  );
}
