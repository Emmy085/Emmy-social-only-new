import crypto from 'crypto';

// Same HMAC approach as password resets: only the hash of the code ever touches Firestore.
export const hmac = (email, code) =>
  crypto.createHmac('sha256', process.env.RESET_SECRET).update(`signup:${email}:${code}`).digest('hex');
