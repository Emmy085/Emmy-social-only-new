import { db } from './firebaseAdmin';
import { getEmail } from './session';

export const isAdminEmail = (e) =>
  (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).includes(e);

// Logged-in user from the session cookie, or null. Never includes the password hash.
export async function currentUser() {
  const email = await getEmail();
  if (!email) return null;
  const snap = await db.collection('users').doc(email).get();
  if (!snap.exists) return null;
  const { pass, ...user } = snap.data();
  return { ...user, email };
}
