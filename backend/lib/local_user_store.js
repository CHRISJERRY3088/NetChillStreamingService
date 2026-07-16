import fs from 'fs';
import path from 'path';
import { supabase } from './supabaseClient.js';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'users.json');

function ensureStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, '[]', 'utf8');
  } catch (e) {
    // ignore
  }
}

function readAll() {
  ensureStore();
  try {
    const txt = fs.readFileSync(STORE_FILE, 'utf8') || '[]';
    return JSON.parse(txt);
  } catch (e) {
    return [];
  }
}

function writeAll(items) {
  ensureStore();
  fs.writeFileSync(STORE_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function normalizeUser(user = {}) {
  const email = user.email ? String(user.email).toLowerCase() : '';
  const id = user.id || user._id || `local-${email || Date.now()}`;
  return {
    id,
    _id: user._id || id,
    fullName: user.fullName || user.full_name || user.name || '',
    email,
    password: user.password || '',
    subscription: user.subscription || 'Free',
    lastLoginAt: user.lastLoginAt || user.last_login_at || null,
    activeDeviceId: user.activeDeviceId || user.active_device_id || null,
  };
}

function toSupabaseProfile(user) {
  const normalized = normalizeUser(user);
  return {
    id: normalized.id,
    email: normalized.email,
    full_name: normalized.fullName,
    subscription: normalized.subscription,
    last_login_at: normalized.lastLoginAt,
    active_device_id: normalized.activeDeviceId,
    updated_at: new Date().toISOString(),
  };
}

async function syncToSupabase(user) {
  try {
    if (!supabase?.from) return;
    const payload = toSupabaseProfile(user);
    await supabase.from('profiles').upsert(payload, { onConflict: 'email' }).select('*').maybeSingle();
  } catch (e) {
    // Ignore Supabase sync failures and fall back to the local file store.
  }
}

export function addUser(user) {
  const normalized = normalizeUser(user);
  const all = readAll();
  const existingIndex = all.findIndex((entry) => String(entry.email).toLowerCase() === String(normalized.email).toLowerCase());
  if (existingIndex >= 0) {
    all[existingIndex] = normalized;
  } else {
    all.push(normalized);
  }
  writeAll(all);
  void syncToSupabase(normalized);
  return normalized;
}

export function findByEmail(email) {
  const all = readAll();
  return all.find((u) => String(u.email).toLowerCase() === String(email).toLowerCase()) || null;
}

export function findById(id) {
  const all = readAll();
  return all.find((u) => String(u.id) === String(id)) || null;
}

export function rememberLogin(user, loginAt = new Date().toISOString(), deviceId = null) {
  const normalized = normalizeUser({
    ...user,
    lastLoginAt: loginAt,
    activeDeviceId: deviceId || user?.activeDeviceId || user?.active_device_id || null,
  });
  const all = readAll();
  const existingIndex = all.findIndex((entry) => String(entry.email).toLowerCase() === String(normalized.email).toLowerCase());
  if (existingIndex >= 0) {
    all[existingIndex] = normalized;
  } else {
    all.push(normalized);
  }
  writeAll(all);
  void syncToSupabase(normalized);
  return normalized;
}

export function canLoginNow() {
  return true;
}

export function clearDeviceSession(user, deviceId = null) {
  const all = readAll();
  const targetEmail = user?.email ? String(user.email).toLowerCase() : '';
  const targetId = user?.id || user?._id || '';
  const existingIndex = all.findIndex((entry) => {
    const sameEmail = targetEmail && String(entry.email).toLowerCase() === targetEmail;
    const sameId = targetId && String(entry.id) === String(targetId);
    return sameEmail || sameId;
  });

  if (existingIndex < 0) return null;

  const entry = all[existingIndex];
  const shouldClear = !deviceId || !entry.activeDeviceId || entry.activeDeviceId === deviceId;
  if (!shouldClear) return entry;

  const updated = normalizeUser({ ...entry, activeDeviceId: null });
  all[existingIndex] = updated;
  writeAll(all);
  void syncToSupabase(updated);
  return updated;
}

export function getNextAllowedLoginAt() {
  return null;
}

export function allUsers() {
  return readAll();
}
