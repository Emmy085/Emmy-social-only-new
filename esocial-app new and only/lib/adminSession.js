import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET);
const NAME = 'es_admin';

export async function setAdminSession() {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('12h')
    .sign(key());
  (await cookies()).set(NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 12 * 3600,
  });
}

export async function clearAdminSession() {
  (await cookies()).delete(NAME);
}

export async function isAdmin() {
  const token = (await cookies()).get(NAME)?.value;
  if (!token) return false;
  try {
    return (await jwtVerify(token, key())).payload.role === 'admin';
  } catch {
    return false;
  }
}
