// Standard "SMM API v2": POST form fields key + action. Set SMM_API_URL and SMM_API_KEY in .env.local.
let cache = { at: 0, list: null };

export async function smm(action, params = {}) {
  const body = new URLSearchParams({ key: process.env.SMM_API_KEY, action, ...params });
  const res = await fetch(process.env.SMM_API_URL, { method: 'POST', body, cache: 'no-store' });
  const data = await res.json().catch(() => {
    throw new Error('Provider sent an unreadable reply');
  });
  // These panels answer HTTP 200 even when something fails, so check the body.
  if (data && !Array.isArray(data) && data.error) throw new Error(String(data.error));
  return data;
}

export async function getServices() {
  if (cache.list && Date.now() - cache.at < 5 * 60_000) return cache.list;
  const list = await smm('services');
  if (!Array.isArray(list)) throw new Error('Unexpected services reply');
  cache = { at: Date.now(), list };
  return list;
}
