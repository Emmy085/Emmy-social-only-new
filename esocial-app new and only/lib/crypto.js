import crypto from 'crypto';

// AES-256-GCM. ACCOUNT_KEY = 64 hex chars (openssl rand -hex 32). Back it up: lose it and sold logins can't be read.
const key = () => Buffer.from(process.env.ACCOUNT_KEY, 'hex');

export const enc = (text) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
};

export const dec = (s) => {
  const [iv, tag, data] = s.split('.').map((x) => Buffer.from(x, 'base64'));
  const c = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  c.setAuthTag(tag);
  return Buffer.concat([c.update(data), c.final()]).toString('utf8');
};
