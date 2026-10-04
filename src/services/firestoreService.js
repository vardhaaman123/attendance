/**
 * firestoreService.js
 * All Firestore read/write helpers used by AppContext.
 * Collections live under: school/{schoolId}/teachers|students|attendance|marks|messages
 * Settings live at: school/{schoolId}/config/settings
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc as fsDeleteDoc,
  onSnapshot,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

// ── Active school ID — pure in-memory, set by AuthContext on login ──
let currentSchoolId = 'dps_main';

export function setActiveSchoolId(id) {
  if (id && String(id).trim()) {
    currentSchoolId = String(id).trim();
  } else {
    currentSchoolId = 'dps_main';
  }
}

export function getActiveSchoolId() {
  return currentSchoolId || 'dps_main';
}


// Helper: get a sub-collection reference
const colRef = (name, schoolId = currentSchoolId) =>
  collection(db, 'schools', schoolId || currentSchoolId || 'dps_main', name);

// Helper: get a document reference inside a sub-collection
const docRef = (name, id, schoolId = currentSchoolId) =>
  doc(db, 'schools', schoolId || currentSchoolId || 'dps_main', name, String(id));

// Helper: settings document reference
const settingsRef = (schoolId = currentSchoolId) =>
  doc(db, 'schools', schoolId || currentSchoolId || 'dps_main', 'config', 'settings');

// ──────────────────────────────────────────────────────────────
// USERS LOOKUP: Global Routing Index for Multi-Tenant Login
// Maps email or rollNumber/USN -> { role, collegeId, entityId, password, ... }
// ──────────────────────────────────────────────────────────────
export function deepSanitize(val) {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val
      .filter((v) => v !== undefined)
      .map((v) => deepSanitize(v));
  }
  const clean = {};
  for (const [k, v] of Object.entries(val)) {
    if (v !== undefined) {
      clean[k] = deepSanitize(v);
    }
  }
  return clean;
}

export const sanitizeLookupKey = (key) =>
  (key || '').trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');

const LOCAL_LOOKUP_KEY = '_attendify_users_lookup';

function getLocalLookupMap() {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_LOOKUP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalLookupMap(map) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(LOCAL_LOOKUP_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('[Storage] setLocalLookupMap failed:', e);
  }
}

export async function saveUserLookup(identifier, data) {
  try {
    const cleanKey = sanitizeLookupKey(identifier);
    if (!cleanKey) return false;
    const cleanData = deepSanitize(data);
    const payload = {
      identifier: cleanKey,
      ...cleanData,
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage immediately so all tabs/windows can authenticate instantly without waiting on network
    try {
      const map = getLocalLookupMap();
      map[cleanKey] = payload;
      setLocalLookupMap(map);
    } catch (_) {}

    // Primary path: /schools/_lookup/users/{cleanKey} (always matches /schools/{schoolId}/** rule)
    try {
      await setDoc(doc(db, 'schools', '_lookup', 'users', cleanKey), payload, { merge: true });
    } catch (e1) {
      console.warn('[Firestore] saveUserLookup (scoped) failed:', e1?.message);
    }
    // Secondary path: /users_lookup/{cleanKey}
    try {
      await setDoc(doc(db, 'users_lookup', cleanKey), payload, { merge: true });
    } catch (e2) {
      console.warn('[Firestore] saveUserLookup (root) failed:', e2?.message);
    }
    return true;
  } catch (e) {
    console.error('[Firestore] saveUserLookup failed:', e);
    return false;
  }
}

export async function getUserLookup(identifier) {
  try {
    const cleanKey = sanitizeLookupKey(identifier);
    if (!cleanKey) return null;

    // 1. Check local lookup map first (zero latency & offline/permission-denied fallback)
    let localFound = null;
    try {
      const map = getLocalLookupMap();
      if (map && map[cleanKey]) {
        localFound = map[cleanKey];
      }
    } catch (_) {}

    // 2. Try Firestore /schools/_lookup/users/{cleanKey}
    try {
      const snapScoped = await getDoc(doc(db, 'schools', '_lookup', 'users', cleanKey));
      if (snapScoped.exists()) {
        const data = snapScoped.data();
        try {
          const map = getLocalLookupMap();
          map[cleanKey] = data;
          setLocalLookupMap(map);
        } catch (_) {}
        return data;
      }
    } catch (_) {}

    // 3. Fallback to Firestore /users_lookup/{cleanKey}
    try {
      const snapRoot = await getDoc(doc(db, 'users_lookup', cleanKey));
      if (snapRoot.exists()) {
        const data = snapRoot.data();
        try {
          const map = getLocalLookupMap();
          map[cleanKey] = data;
          setLocalLookupMap(map);
        } catch (_) {}
        return data;
      }
    } catch (_) {}

    // 4. Return local cached lookup if found
    if (localFound) return localFound;

    // 5. Fallback inspection: search cached students if identifier matches email or roll number
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const studentsRaw = window.localStorage.getItem('_attendify_students_cache');
        if (studentsRaw) {
          const list = JSON.parse(studentsRaw);
          if (Array.isArray(list)) {
            const found = list.find((s) => {
              const em = s.email && s.email.trim().toLowerCase() === cleanKey;
              const pem = s.parentEmail && s.parentEmail.trim().toLowerCase() === cleanKey;
              const r = s.rollNumber && (
                String(s.rollNumber).trim().toLowerCase() === cleanKey ||
                String(s.rollNumber).replace(/^0+/, '').toLowerCase() === cleanKey.replace(/^0+/, '')
              );
              return em || pem || r;
            });
            if (found) {
              const synthesized = {
                role: 'student',
                collegeId: found.collegeId || 'dps_main',
                entityId: found.id || found._docId,
                id: found.id || found._docId,
                name: found.name,
                rollNumber: found.rollNumber,
                class: found.class,
                section: found.section,
                password: found.password || '1234',
                email: found.email || found.parentEmail || '',
                parentEmail: found.parentEmail || found.email || '',
                updatedAt: new Date().toISOString(),
              };
              try {
                const map = getLocalLookupMap();
                map[cleanKey] = synthesized;
                setLocalLookupMap(map);
              } catch (_) {}
              return synthesized;
            }
          }
        }
      }
    } catch (_) {}

    return null;
  } catch (e) {
    console.error('[Firestore] getUserLookup failed:', e);
    return null;
  }
}

export async function deleteUserLookup(identifier) {
  try {
    const cleanKey = sanitizeLookupKey(identifier);
    if (!cleanKey) return;
    try {
      const map = getLocalLookupMap();
      delete map[cleanKey];
      setLocalLookupMap(map);
    } catch (_) {}
    try {
      await fsDeleteDoc(doc(db, 'schools', '_lookup', 'users', cleanKey));
    } catch (_) {}
    try {
      await fsDeleteDoc(doc(db, 'users_lookup', cleanKey));
    } catch (_) {}
  } catch (e) {
    console.error('[Firestore] deleteUserLookup failed:', e);
  }
}
// ──────────────────────────────────────────────────────────────
// SESSION: Store teacher/student sessions in Firestore
// Key is a random token held in sessionStorage (tab-scoped)
// ──────────────────────────────────────────────────────────────
export async function saveSession(sessionKey, data) {
  try {
    if (!sessionKey) return false;
    const sanitized = deepSanitize(data);
    await setDoc(
      doc(db, 'schools', '_session', 'sessions', sessionKey),
      { ...sanitized, _savedAt: new Date().toISOString() },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('[Firestore] saveSession failed:', e);
    return false;
  }
}

export async function getSession(sessionKey) {
  try {
    if (!sessionKey) return null;
    const snap = await getDoc(doc(db, 'schools', '_session', 'sessions', sessionKey));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error('[Firestore] getSession failed:', e);
    return null;
  }
}

export async function deleteSession(sessionKey) {
  try {
    if (!sessionKey) return;
    await fsDeleteDoc(doc(db, 'schools', '_session', 'sessions', sessionKey));
  } catch (e) {
    console.error('[Firestore] deleteSession failed:', e);
  }
}

// ──────────────────────────────────────────────────────────────
// READ: fetch all documents from a collection as an array
// ──────────────────────────────────────────────────────────────
export async function fetchCollection(name, schoolId) {
  try {
    const targetSchool = schoolId || currentSchoolId || 'dps_main';
    let snap = await getDocs(colRef(name, targetSchool));
    if (snap.empty && targetSchool !== 'dps_main') {
      try {
        const fallbackSnap = await getDocs(colRef(name, 'dps_main'));
        if (!fallbackSnap.empty) snap = fallbackSnap;
      } catch (_) {}
    }
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data(), _docId: d.id }));
    if (docs.length > 0) return docs;

    // Resilient fallback to local cache if Firestore returned 0 docs or is warming up
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = window.localStorage.getItem(`_attendify_${name}_cache`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return [];
  } catch (e) {
    console.error(`[Firestore] fetchCollection(${name}) failed:`, e);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = window.localStorage.getItem(`_attendify_${name}_cache`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return [];
  }
}

// ──────────────────────────────────────────────────────────────
// WRITE: set (create or overwrite) a single document
// ──────────────────────────────────────────────────────────────
export async function saveDoc(colName, id, data, schoolId) {
  try {
    const targetSchool = schoolId || currentSchoolId || 'dps_main';
    // Remove internal helper field before saving
    // eslint-disable-next-line no-unused-vars
    const { _docId, ...clean } = data;
    const sanitized = deepSanitize({ id: String(id), ...clean });
    await setDoc(docRef(colName, id, targetSchool), sanitized, { merge: true });

    // Always mirror to 'dps_main' if targetSchool is a custom tenant
    if (targetSchool !== 'dps_main') {
      try {
        await setDoc(docRef(colName, id, 'dps_main'), { ...sanitized, collegeId: targetSchool }, { merge: true });
      } catch (_) {}
    }
    return true;
  } catch (e) {
    console.error(`[Firestore] saveDoc(${colName}/${id}) failed:`, e);
    return false;
  }
}

// ──────────────────────────────────────────────────────────────
// DELETE: remove a single document
// ──────────────────────────────────────────────────────────────
export async function deleteDoc(colName, id, schoolId) {
  try {
    const targetSchool = schoolId || currentSchoolId || 'dps_main';
    await fsDeleteDoc(docRef(colName, id, targetSchool));
    if (targetSchool !== 'dps_main') {
      try {
        await fsDeleteDoc(docRef(colName, id, 'dps_main'));
      } catch (_) {}
    }
  } catch (e) {
    console.error(`[Firestore] deleteDoc(${colName}/${id}) failed:`, e);
  }
}

// ──────────────────────────────────────────────────────────────
// BATCH WRITE: upload an array of items all at once (used for seed data)
// ──────────────────────────────────────────────────────────────
export async function batchSaveCollection(colName, items, idField = 'id', schoolId) {
  try {
    const targetSchool = schoolId || currentSchoolId || 'dps_main';
    if (!items || items.length === 0) return true;

    const commitBatchTo = async (sId) => {
      const CHUNK = 400;
      for (let i = 0; i < items.length; i += CHUNK) {
        const batch = writeBatch(db);
        items.slice(i, i + CHUNK).forEach((item) => {
          const id = String(item[idField] || item.id || item._docId || '');
          if (!id) return;
          // eslint-disable-next-line no-unused-vars
          const { _docId, ...clean } = item;
          const sanitized = deepSanitize(clean);
          batch.set(docRef(colName, id, sId), sanitized, { merge: true });
        });
        await batch.commit();
      }
    };

    await commitBatchTo(targetSchool);
    if (targetSchool !== 'dps_main') {
      try {
        await commitBatchTo('dps_main');
      } catch (_) {}
    }
    return true;
  } catch (err) {
    console.error(`[Firestore] batchSaveCollection(${colName}) failed:`, err);
    return false;
  }
}

// ──────────────────────────────────────────────────────────────
// SETTINGS: single document read / write
// ──────────────────────────────────────────────────────────────
export async function fetchSettings(schoolId) {
  try {
    const targetSchool = schoolId || currentSchoolId || 'dps_main';
    const snap = await getDoc(settingsRef(targetSchool));
    if (snap.exists()) return snap.data();
    if (targetSchool !== 'dps_main') {
      const fallbackSnap = await getDoc(settingsRef('dps_main'));
      if (fallbackSnap.exists()) return fallbackSnap.data();
    }
    return null;
  } catch (e) {
    console.error('[Firestore] fetchSettings failed:', e);
    return null;
  }
}

export async function saveSettings(data, schoolId) {
  try {
    const targetSchool = schoolId || currentSchoolId || 'dps_main';
    const sanitized = deepSanitize(data);
    await setDoc(settingsRef(targetSchool), sanitized, { merge: true });
    if (targetSchool !== 'dps_main') {
      try {
        await setDoc(settingsRef('dps_main'), sanitized, { merge: true });
      } catch (_) {}
    }
  } catch (e) {
    console.error('[Firestore] saveSettings failed:', e);
  }
}

// ──────────────────────────────────────────────────────────────
// CHECK: does a collection have any documents? (used by seed logic)
// ──────────────────────────────────────────────────────────────
export async function isCollectionEmpty(name, schoolId) {
  try {
    const targetSchool = schoolId || currentSchoolId || 'dps_main';
    const snap = await getDocs(colRef(name, targetSchool));
    return snap.empty;
  } catch (e) {
    console.error(`[Firestore] isCollectionEmpty(${name}) failed:`, e);
    return false; // assume NOT empty to avoid accidental re-seeding
  }
}

// ──────────────────────────────────────────────────────────────
// REAL-TIME: subscribe to a collection with onSnapshot
// Returns an unsubscribe function — call it to stop listening.
// ──────────────────────────────────────────────────────────────
export function subscribeCollection(name, onChange, schoolId) {
  const targetSchool = schoolId || currentSchoolId || 'dps_main';
  return onSnapshot(
    colRef(name, targetSchool),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data(), _docId: d.id }));
      onChange(items);
    },
    (err) => {
      console.error(`[Firestore] subscribeCollection(${name}) error:`, err);
      try { onChange(null); } catch (_) {}
    }
  );
}

// ──────────────────────────────────────────────────────────────
// REAL-TIME: subscribe to the settings document
// ──────────────────────────────────────────────────────────────
export function subscribeSettings(onChange, schoolId) {
  const targetSchool = schoolId || currentSchoolId || 'dps_main';
  return onSnapshot(
    settingsRef(targetSchool),
    (snap) => {
      if (snap.exists()) onChange(snap.data());
    },
    (err) => {
      console.error('[Firestore] subscribeSettings error:', err);
    }
  );
}

// ──────────────────────────────────────────────────────────────
// BATCH DELETE: delete all docs in a collection matching a filter
// ──────────────────────────────────────────────────────────────
export async function batchDeleteCollection(colName, ids, schoolId) {
  try {
    const targetSchool = schoolId || currentSchoolId || 'dps_main';
    if (!ids || ids.length === 0) return;

    const deleteFrom = async (sId) => {
      const CHUNK = 400;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const batch = writeBatch(db);
        ids.slice(i, i + CHUNK).forEach((id) => {
          if (id) {
            batch.delete(docRef(colName, String(id), sId));
          }
        });
        await batch.commit();
      }
    };

    await deleteFrom(targetSchool);
    if (targetSchool !== 'dps_main') {
      try {
        await deleteFrom('dps_main');
      } catch (_) {}
    }
  } catch (err) {
    console.error(`[Firestore] batchDeleteCollection(${colName}) failed:`, err);
  }
}

// ──────────────────────────────────────────────────────────────
// ADMIN: save and retrieve admin profiles from Firestore
// ──────────────────────────────────────────────────────────────
export async function getAdminByEmail(email, schoolId) {
  try {
    const targetSchool = schoolId || currentSchoolId || 'dps_main';
    const cleanId = (email || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const snap = await getDoc(docRef('admins', cleanId, targetSchool));
    if (snap.exists()) return snap.data();
    if (targetSchool !== 'dps_main') {
      try {
        const fallbackSnap = await getDoc(docRef('admins', cleanId, 'dps_main'));
        if (fallbackSnap.exists()) return fallbackSnap.data();
      } catch (_) {}
    }
    return null;
  } catch (e) {
    console.error('[Firestore] getAdminByEmail failed:', e);
    return null;
  }
}

export async function saveAdmin(email, data, schoolId) {
  try {
    const targetSchool = schoolId || currentSchoolId || 'dps_main';
    const cleanId = (email || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    await setDoc(docRef('admins', cleanId, targetSchool), data, { merge: true });
    if (targetSchool !== 'dps_main') {
      try {
        await setDoc(docRef('admins', cleanId, 'dps_main'), data, { merge: true });
      } catch (_) {}
    }
    return true;
  } catch (e) {
    console.error('[Firestore] saveAdmin failed:', e);
    return false;
  }
}

// ──────────────────────────────────────────────────────────────
// LIVE EVENT BROADCAST: Instant cross-tab sync (BroadcastChannel + storage fallback)
// ──────────────────────────────────────────────────────────────
const LIVE_CHANNEL_NAME = 'attendify_live_channel';
const STORAGE_SYNC_KEY = '_attendify_live_event';

let sharedBroadcastChannel = null;

function getSharedChannel() {
  if (typeof window === 'undefined') return null;
  if (!('BroadcastChannel' in window)) return null;
  if (!sharedBroadcastChannel) {
    try {
      sharedBroadcastChannel = new BroadcastChannel(LIVE_CHANNEL_NAME);
    } catch (err) {
      console.warn('[LiveSync] BroadcastChannel init failed:', err);
    }
  }
  return sharedBroadcastChannel;
}

export function broadcastLiveEvent(eventType, payload = {}) {
  const eventData = {
    type: eventType,
    payload,
    timestamp: Date.now(),
    sourceTabId: Math.random().toString(36).substring(2, 9),
  };

  // 1. Instant BroadcastChannel dispatch (shared channel, never closed prematurely)
  try {
    const channel = getSharedChannel();
    if (channel) {
      channel.postMessage(eventData);
    }
  } catch (err) {
    console.warn('[LiveSync] BroadcastChannel post failed:', err);
  }

  // 2. Instant localStorage event for all other open tabs/windows
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(eventData));
    }
  } catch (err) {
    console.warn('[LiveSync] localStorage sync write failed:', err);
  }
}

export function listenLiveEvents(onEvent) {
  if (typeof window === 'undefined') return () => {};

  // 1. Dedicated BroadcastChannel receiver
  let listenerChannel = null;
  try {
    if ('BroadcastChannel' in window) {
      listenerChannel = new BroadcastChannel(LIVE_CHANNEL_NAME);
      listenerChannel.onmessage = (evt) => {
        if (evt?.data) {
          onEvent(evt.data);
        }
      };
    }
  } catch (err) {
    console.warn('[LiveSync] BroadcastChannel listen failed:', err);
  }

  // 2. Storage event listener (fires across other tabs/windows of the same origin)
  const handleStorage = (e) => {
    if (e.key === STORAGE_SYNC_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed) onEvent(parsed);
      } catch (_) {}
    }
    if (e.key === '_attendify_messages_cache' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          onEvent({ type: 'CACHE_SYNC', payload: { messages: parsed } });
        }
      } catch (_) {}
    }
  };

  window.addEventListener('storage', handleStorage);

  // 3. Ultra-fast local heartbeat poller (700ms) as unbreakable safety net
  let lastCheckedTime = Date.now();
  let lastSeenEventTimestamp = 0;
  const pollTimer = setInterval(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Check live event key
        const rawEvent = window.localStorage.getItem(STORAGE_SYNC_KEY);
        if (rawEvent) {
          try {
            const parsedEvent = JSON.parse(rawEvent);
            if (parsedEvent?.timestamp && parsedEvent.timestamp > lastSeenEventTimestamp) {
              lastSeenEventTimestamp = parsedEvent.timestamp;
              onEvent(parsedEvent);
            }
          } catch (_) {}
        }

        // Check messages cache
        const rawCache = window.localStorage.getItem('_attendify_messages_cache');
        if (rawCache) {
          try {
            const list = JSON.parse(rawCache);
            if (Array.isArray(list) && list.length > 0) {
              onEvent({ type: 'CACHE_POLL', payload: { messages: list } });
            }
          } catch (_) {}
        }
      }
    } catch (_) {}
  }, 700);

  return () => {
    if (listenerChannel) {
      listenerChannel.close();
    }
    window.removeEventListener('storage', handleStorage);
    clearInterval(pollTimer);
  };
}

