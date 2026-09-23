import { db } from './firebaseAdmin';

// type: 'percent' adds a % on top of the provider price; 'fixed' adds a flat naira amount.
export const DEFAULT_PROFIT = {
  boost: { type: 'percent', value: 30 },
  numbers: { type: 'percent', value: 30 },
};

export async function getProfit() {
  const s = await db.collection('settings').doc('profit').get();
  return { ...DEFAULT_PROFIT, ...(s.exists ? s.data() : {}) };
}

// Rounds up to 2 decimals so you never end up charging below your cost.
export const withProfit = (base, cfg) =>
  Math.ceil((cfg.type === 'fixed' ? base + Number(cfg.value) : base * (1 + Number(cfg.value) / 100)) * 100) / 100;
