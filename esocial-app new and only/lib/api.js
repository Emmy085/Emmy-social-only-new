// Browser helper: JSON in, JSON out, throws Error(message) with .status on failure.
export async function api(url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(d.error || 'Something went wrong.');
    e.status = r.status;
    throw e;
  }
  return d;
}
