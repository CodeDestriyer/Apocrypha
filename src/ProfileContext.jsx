import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase, getSession, loadProfile, createProfile, saveProfile } from './supabase.js';

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
  const pendingPatch = useRef({});
  const currentUserId = useRef(null);

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
      setProfile(p);
      setStatus('ready');
    } catch (e) {
      console.error(e);
      setError(e.message || String(e));
      setStatus('error');
    }
  };

  const update = (patchOrFn) => {
    setProfile((curr) => {
      const patch = typeof patchOrFn === 'function' ? patchOrFn(curr) : patchOrFn;
      pendingPatch.current = { ...pendingPatch.current, ...patch };
      return { ...curr, ...patch };
    });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const toSave = pendingPatch.current;
      pendingPatch.current = {};
      try { await saveProfile(toSave); }
      catch (e) { console.error('save failed', e); }
    }, 600);
  };

  return (
    <ProfileContext.Provider value={{ status, profile, error, defaultName, googleAvatar, submitName, update }}>
      {children}
    </ProfileContext.Provider>
  );
}
