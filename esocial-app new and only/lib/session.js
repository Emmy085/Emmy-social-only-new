import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function setSession(email) {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(key());
  (await cookies()).set('es_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 86400,
  });
}

export async function clearSession() {
  (await cookies()).delete('es_session');
}

export async function getEmail() {
  const token = (await cookies()).get('es_session')?.value;
  if (!token) return null;
  try {
    return (await jwtVerify(token, key())).payload.email;
  } catch {
    return null;
  }
}
