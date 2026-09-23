import crypto from 'crypto';

// Only the hash of a reset code is ever stored in Firestore.
export const hmac = (email, code) =>
  crypto.createHmac('sha256', process.env.RESET_SECRET).update(`${email}:${code}`).digest('hex');
