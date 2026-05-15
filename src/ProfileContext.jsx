import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ensureSession, loadProfile, createProfile, saveProfile } from './supabase.js';

const ProfileContext = createContext(null);

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>');
  return ctx;
}

export function ProfileProvider({ children }) {
  const [status, setStatus] = useState('loading'); // loading | need-name | ready | error
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const saveTimer = useRef(null);
  const pendingPatch = useRef({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSession();
        const p = await loadProfile();
        if (cancelled) return;
        if (!p) {
          setStatus('need-name');
        } else {
          setProfile(p);
          setStatus('ready');
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(e.message || String(e));
          setStatus('error');
        }
      }
    })();
    return () => { cancelled = true; };
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

  const update = (patch) => {
    setProfile((curr) => ({ ...curr, ...patch }));
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const toSave = pendingPatch.current;
      pendingPatch.current = {};
      try { await saveProfile(toSave); }
      catch (e) { console.error('save failed', e); }
    }, 600);
  };

  return (
    <ProfileContext.Provider value={{ status, profile, error, submitName, update }}>
      {children}
    </ProfileContext.Provider>
  );
}
