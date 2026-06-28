import { supabase } from './supabase.js';

const API = 'https://www.googleapis.com/calendar/v3';

async function token() {
  const { data: { session } } = await supabase.auth.getSession();
  const t = session?.provider_token;
  if (!t) throw new Error('no_google_token');
  return t;
}

async function call(path, opts = {}) {
  const t = await token();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${t}`,
      'Content-Type': 'application/json',
      ...(opts.headers ?? {}),
    },
  });
  if (res.status === 401) throw new Error('google_token_expired');
  if (res.status === 410) throw new Error('sync_token_gone');
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`google_${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function listEvents(calendarId, { syncToken, pageToken, privateProp } = {}) {
  const params = new URLSearchParams();
  if (syncToken) params.set('syncToken', syncToken);
  else {
    params.set('singleEvents', 'true');
    params.set('showDeleted', 'false');
    if (privateProp) params.set('privateExtendedProperty', privateProp);
  }
  params.set('maxResults', '500');
  if (pageToken) params.set('pageToken', pageToken);
  return call(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
}

export async function listAllEvents(calendarId, opts = {}) {
  const items = [];
  let pageToken;
  let nextSyncToken;
  do {
    const page = await listEvents(calendarId, { ...opts, pageToken });
    if (page.items) items.push(...page.items);
    pageToken = page.nextPageToken;
    if (page.nextSyncToken) nextSyncToken = page.nextSyncToken;
  } while (pageToken);
  return { items, nextSyncToken };
}

export async function insertEvent(calendarId, event) {
  return call(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function patchEvent(calendarId, eventId, patch) {
  return call(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteEvent(calendarId, eventId) {
  return call(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  });
}
