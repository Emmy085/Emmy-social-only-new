// 5sim.net API. Docs: https://5sim.net/docs. Bearer token in FIVESIM_API_KEY (server only).
const BASE = 'https://5sim.net/v1';

async function call(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${process.env.FIVESIM_API_KEY}`,
      Accept: 'application/json',
      ...(opts.headers || {}),
    },
    cache: 'no-store',
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data.message || data.raw || `5sim error (${res.status})`);
  return data;
}

let cache = { at: 0, list: null };

// Prices for every country/product/operator in one call, cached 5 minutes.
export async function getPrices() {
  if (cache.list && Date.now() - cache.at < 5 * 60_000) return cache.list;
  const data = await call('/guest/prices');
  cache = { at: Date.now(), list: data };
  return data;
}

// Every product (service) your 5sim account can sell, across all countries. No guessing/hardcoding needed.
export async function getProducts() {
  const prices = await getPrices();
  const products = new Set();
  for (const byProduct of Object.values(prices)) for (const p of Object.keys(byProduct)) products.add(p);
  return [...products].sort();
}

export const buyNumber = (country, product) =>
  call(`/user/buy/activation/${country}/any/${product}`);

export const checkNumber = (orderId) => call(`/user/check/${orderId}`);

export const cancelNumber = (orderId) => call(`/user/cancel/${orderId}`);

export const finishNumber = (orderId) => call(`/user/finish/${orderId}`);
