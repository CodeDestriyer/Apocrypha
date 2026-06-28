import { supabase } from './supabase.js';
import { listAllEvents, insertEvent, patchEvent, deleteEvent } from './googleCalendar.js';

const VARKANIS_PRIVATE_PROP = 'varkanis_kind=day_plan';
const CAL = 'primary';

function nextDayISO(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

function planToEvent(plan) {
  return {
    summary: plan.done ? `✓ ${plan.title}` : plan.title,
    start: { date: plan.day },
    end: { date: nextDayISO(plan.day) },
    extendedProperties: {
      private: {
        varkanis_id: plan.id,
        varkanis_kind: 'day_plan',
        varkanis_done: plan.done ? '1' : '0',
      },
    },
  };
}

function eventToPlan(ev, existingId = null) {
  const priv = ev.extendedProperties?.private ?? {};
  const id = existingId ?? priv.varkanis_id ?? null;
  const title = (ev.summary ?? '').replace(/^✓\s*/, '');
  const day = ev.start?.date ?? (ev.start?.dateTime ?? '').slice(0, 10);
  const done = priv.varkanis_done === '1' || /^✓/.test(ev.summary ?? '');
  return {
    id,
    title,
    day,
    done,
    google_event_id: ev.id,
    google_etag: ev.etag,
    google_updated: ev.updated,
  };
}

function googleUpdatedMs(ev) {
  return ev?.updated ? Date.parse(ev.updated) : 0;
}

function localUpdatedMs(plan) {
  return plan?.updated_at ? Date.parse(plan.updated_at) : 0;
}

// Single sync pass for day_plans only. Returns a profile patch ({day_plans})
// or null if no change. On Google-side auth/sync errors throws so caller can
// surface a status to the user.
export async function syncDayPlans(profile) {
  const localPlans = Array.isArray(profile.day_plans) ? [...profile.day_plans] : [];

  const { items: googleItems } = await listAllEvents(CAL, { privateProp: VARKANIS_PRIVATE_PROP });
  const byVarkanisId = new Map();
  const orphanGoogle = [];
  for (const ev of googleItems) {
    const id = ev.extendedProperties?.private?.varkanis_id;
    if (id) byVarkanisId.set(id, ev);
    else orphanGoogle.push(ev);
  }

  const next = [];
  const knownGoogleIds = new Set();

  for (const plan of localPlans) {
    const matched = plan.id ? byVarkanisId.get(plan.id) : null;
    if (matched) {
      knownGoogleIds.add(plan.id);
      const gMs = googleUpdatedMs(matched);
      const lMs = localUpdatedMs(plan);
      if (lMs > gMs) {
        const patched = await patchEvent(CAL, matched.id, planToEvent(plan));
        next.push({ ...plan, google_event_id: patched.id, google_etag: patched.etag, google_updated: patched.updated });
      } else if (gMs > lMs) {
        const fromG = eventToPlan(matched, plan.id);
        next.push({ ...plan, title: fromG.title, day: fromG.day, done: fromG.done, google_event_id: matched.id, google_etag: matched.etag, google_updated: matched.updated, updated_at: matched.updated });
      } else {
        next.push({ ...plan, google_event_id: matched.id, google_etag: matched.etag, google_updated: matched.updated });
      }
    } else if (plan.google_event_id) {
      // Was on Google but is gone now → user deleted in Google. Drop locally.
      continue;
    } else {
      const created = await insertEvent(CAL, planToEvent(plan));
      knownGoogleIds.add(plan.id);
      next.push({ ...plan, google_event_id: created.id, google_etag: created.etag, google_updated: created.updated });
    }
  }

  // Google events created outside the app (no varkanis_id) — import as new
  // local day_plans, then stamp them with a varkanis_id by patching the event.
  for (const ev of orphanGoogle) {
    const day = ev.start?.date ?? (ev.start?.dateTime ?? '').slice(0, 10);
    if (!day) continue;
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(36).slice(2, 8);
    const title = ev.summary ?? '';
    const done = false;
    const newPlan = {
      id, title, day, done,
      created_at: ev.created ?? new Date().toISOString(),
      updated_at: ev.updated ?? new Date().toISOString(),
      google_event_id: ev.id,
      google_etag: ev.etag,
      google_updated: ev.updated,
    };
    try {
      await patchEvent(CAL, ev.id, {
        extendedProperties: { private: { varkanis_id: id, varkanis_kind: 'day_plan', varkanis_done: '0' } },
      });
    } catch (e) { console.warn('stamp orphan event failed', e); }
    next.push(newPlan);
  }

  // Persist last sync timestamp on the credentials row.
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('google_sync').upsert({
        user_id: user.id,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } catch (e) { console.warn('google_sync last_synced_at update failed', e); }

  return { day_plans: next };
}

export async function pushDeletedDayPlan(googleEventId) {
  if (!googleEventId) return;
  try { await deleteEvent(CAL, googleEventId); }
  catch (e) {
    if (String(e.message).startsWith('google_404') || String(e.message).startsWith('google_410')) return;
    throw e;
  }
}
