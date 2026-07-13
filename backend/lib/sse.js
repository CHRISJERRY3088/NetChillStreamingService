// Simple Server-Sent Events manager
const clients = new Map(); // userId => Set(res)

export function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
}

export function removeClient(userId, res) {
  if (!clients.has(userId)) return;
  clients.get(userId).delete(res);
  if (clients.get(userId).size === 0) clients.delete(userId);
}

function sendEvent(res, event, data) {
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (e) {
    // ignore
  }
}

export function broadcastToUser(userId, event, data) {
  const set = clients.get(String(userId));
  if (!set) return 0;
  for (const res of set) {
    sendEvent(res, event, data);
  }
  return set.size;
}

export function broadcastAll(event, data) {
  for (const [userId, set] of clients.entries()) {
    for (const res of set) sendEvent(res, event, data);
  }
}
