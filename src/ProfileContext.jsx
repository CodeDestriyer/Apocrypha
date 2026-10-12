import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  supabase, loadProfile, createProfile, saveProfile, mergeProfilePatch, MERGEABLE_COLUMNS,
  readStoredUser, readCachedProfile, writeCachedProfile, clearCachedProfile,
} from './supabase.js';

const ProfileContext = createContext(null);

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>');
  return ctx;
}

const avatarOf = (user) => {
  const meta = user?.user_metadata ?? {};
  return meta.avatar_url || meta.picture || null;
};

export function ProfileProvider({ children }) {
  // Paint from the cached profile straight away when the stored session belongs
  // to the same user; the DB copy is fetched in the background and reconciled
  // (see adoptFresh). Until then the profile is "stale" and saves are held.
  const boot = useRef(null);
  if (boot.current === null) {
    const user = readStoredUser();
    boot.current = { user, cached: readCachedProfile(user?.id) };
  }
  const { cached: bootCached, user: bootUser } = boot.current;

  const [status, setStatus] = useState(bootCached ? 'ready' : 'loading'); // loading | unauthenticated | need-name | ready | error
  const [profile, setProfile] = useState(bootCached);
  const [error, setError] = useState(null);
  const [defaultName, setDefaultName] = useState('');
  const [googleAvatar, setGoogleAvatar] = useState(bootCached ? avatarOf(bootUser) : null);
  const saveTimer = useRef(null);
  const maxTimer = useRef(null);
  const pendingPatch = useRef({});
  const currentUserId = useRef(bootCached ? bootUser.id : null);
  const staleRef = useRef(!!bootCached);
  const retryBootRef = useRef(() => {});
  // For the rule-column 3-way merge: `syncedRef` = last values confirmed synced
  // with the DB (the merge baseline); `latestRef` = this session's current
  // in-memory profile. Both are kept up to date as the profile loads and saves.
  const syncedRef = useRef(bootCached);
  const latestRef = useRef(bootCached);
  const setSynced = (p) => {
    syncedRef.current = p;
    latestRef.current = p;
    writeCachedProfile(p);
  };
  // For the background refresh-on-focus (B1): a live mirror of `status` so the
  // visibility handler can read it without re-subscribing, and a throttle stamp
  // so rapid tab focus toggles don't hammer the DB.
  const statusRef = useRef(status);
  statusRef.current = status;
  const lastRefreshRef = useRef(0);

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

    const dropStale = () => {
      staleRef.current = false;
      pendingPatch.current = {};
      clearCachedProfile();
    };

    const handleSession = async (session) => {
      try {
        if (!session) {
          currentUserId.current = null;
          dropStale();
          if (!cancelled) {
            setGoogleAvatar(null);
            setStatus('unauthenticated');
          }
          return;
        }
        const meta = session.user?.user_metadata ?? {};
        const showingCache = staleRef.current && currentUserId.current === session.user?.id;
        if (!showingCache) {
          if (staleRef.current) dropStale(); // cache belongs to another account
          if (!cancelled) setStatus('loading');
        }
        if (!cancelled) setGoogleAvatar(avatarOf(session.user));
        let p;
        try {
          p = await withTimeout(loadProfile(), 6000, 'loadProfile');
        } catch (e) {
          // Offline or slow: keep showing the cached copy; retried on refocus/online.
          if (showingCache && staleRef.current) { console.error(e); return; }
          throw e;
        }
        if (cancelled) return;
        if (p && staleRef.current && currentUserId.current === session.user?.id) {
          adoptFresh(p);
          return;
        }
        if (!p && staleRef.current) {
          dropStale();
          if (!cancelled) setStatus('loading');
        }
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

    let booting = false;
    const bootstrap = async () => {
      if (booting) return;
      booting = true;
      try {
        const { data, error: authError } = await supabase.auth.getSession();
        // A failed token refresh only signs out when it's not a network error —
        // supabase keeps the stored session in that case, and so do we.
        if (authError && !data.session && staleRef.current && readStoredUser()) return;
        await handleSession(data.session);
      } catch (e) {
        console.error(e);
        if (!cancelled && !staleRef.current) setStatus('unauthenticated');
      } finally {
        booting = false;
        clearTimeout(loadingFallback);
      }
    };
    retryBootRef.current = () => { if (staleRef.current) bootstrap(); };
    bootstrap();

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

  // First DB read after painting from cache. Edits made on the cached copy are
  // kept only where they can't clobber another device: a column nobody else
  // touched keeps the local edit; a mergeable column changed elsewhere gets the
  // usual 3-way merge with the cached copy as its base; any other column
  // changed elsewhere takes the server's value.
  const adoptFresh = (fresh) => {
    const cached = syncedRef.current || {};
    const pending = pendingPatch.current;
    const base = { ...fresh };
    for (const k of Object.keys(pending)) {
      if (JSON.stringify(fresh[k]) === JSON.stringify(cached[k])) continue;
      if (MERGEABLE_COLUMNS.includes(k)) base[k] = cached[k];
      else delete pending[k];
    }
    const keep = new Set(Object.keys(pending));
    staleRef.current = false;
    syncedRef.current = base;
    writeCachedProfile(fresh);
    setProfile((curr) => {
      const next = { ...(curr || {}) };
      for (const k of Object.keys(fresh)) if (!keep.has(k)) next[k] = fresh[k];
      latestRef.current = next;
      return next;
    });
    if (keep.size) flushNow();
  };

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
    // Edits made on the cached copy wait for adoptFresh to rebase them.
    if (staleRef.current) return;
    const toSave = pendingPatch.current;
    if (!toSave || Object.keys(toSave).length === 0) return;
    pendingPatch.current = {};

    // Mergeable columns (rules, tasks, decks…) go through a 3-way merge against
    // the row's live value so a stale session can't clobber items another device
    // added; everything else saves as a plain patch.
    const needsMerge = MERGEABLE_COLUMNS.some((k) => k in toSave);
    const build = needsMerge
      ? mergeProfilePatch(toSave, syncedRef.current, latestRef.current)
      : Promise.resolve(toSave);

    return build
      .catch((e) => {
        // If fetching the live values for the merge fails, fall back to the plain
        // patch rather than dropping the save entirely.
        console.error('merge failed, saving local copy', e);
        return toSave;
      })
      .then((patch) => saveProfile(patch))
      .then((saved) => {
        if (!saved) return;
        // The saved row is the merged truth. Advance the sync baseline, then
        // reflect merged columns back into the UI so items added elsewhere show
        // up — but only for columns without a newer edit already queued, so we
        // don't clobber an in-flight local change.
        syncedRef.current = saved;
        writeCachedProfile(saved);
        const reflect = MERGEABLE_COLUMNS.filter((k) => k in toSave && !(k in pendingPatch.current));
        if (reflect.length === 0) {
          latestRef.current = { ...latestRef.current, ...saved };
          return;
        }
        setProfile((curr) => {
          if (!curr) return curr;
          const next = { ...curr };
          for (const k of reflect) next[k] = saved[k];
          latestRef.current = next;
          return next;
        });
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

  // Background refresh (B1): when the app comes back to the foreground, quietly
  // reload the profile from the DB and fold in any columns that changed on
  // another device — WITHOUT remounting (no status flip) so the current view
  // and in-progress UI state (open deck, study index) survive. Columns with an
  // unsaved local edit still queued are left untouched so we never clobber the
  // user's own pending changes.
  const refreshFromServer = async () => {
    if (document.visibilityState !== 'visible') return;
    if (staleRef.current) { retryBootRef.current(); return; }
    if (statusRef.current !== 'ready' || !currentUserId.current) return;
    const now = Date.now();
    if (now - lastRefreshRef.current < 4000) return; // throttle rapid focus toggles
    lastRefreshRef.current = now;
    try {
      const fresh = await loadProfile();
      if (!fresh || !currentUserId.current) return;
      const pending = pendingPatch.current;
      setProfile((curr) => {
        if (!curr) return curr;
        const next = { ...curr };
        for (const k of Object.keys(fresh)) {
          if (k in pending) continue; // keep unsaved local edits for this column
          next[k] = fresh[k];
        }
        latestRef.current = next;
        return next;
      });
      syncedRef.current = fresh;
      writeCachedProfile(fresh);
    } catch (e) {
      console.error('background profile refresh failed', e);
    }
  };

  // Flush pending changes when the tab is hidden or the page is unloading —
  // covers navigating away, closing, and the service-worker update reload that
  // fires on refocus (window.location.reload in main.jsx). Without this the
  // trailing debounced save is lost on every such transition. On the way back
  // to visible we also pull fresh data (see refreshFromServer above).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushNow();
      else if (document.visibilityState === 'visible') refreshFromServer();
    };
    const onOnline = () => retryBootRef.current();
    window.addEventListener('pagehide', flushNow);
    window.addEventListener('lr:flush-save', flushNow);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('online', onOnline);
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
