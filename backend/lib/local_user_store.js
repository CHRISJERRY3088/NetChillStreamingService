import fs from 'fs';
import path from 'path';

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

export function addUser(user) {
  const all = readAll();
  all.push(user);
  writeAll(all);
  return user;
}

export function findByEmail(email) {
  const all = readAll();
  return all.find(u => String(u.email).toLowerCase() === String(email).toLowerCase()) || null;
}

export function findById(id) {
  const all = readAll();
  return all.find(u => String(u.id) === String(id)) || null;
}

export function allUsers() {
  return readAll();
}
