'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.HOME_PASSWORD || 'default-secret-at-least-32-chars-long'
);

export async function loginWithHomePassword(formData: FormData) {
  const password = formData.get('password') as string;
  const correctPassword = process.env.HOME_PASSWORD;

  if (!correctPassword) {
    console.error('HOME_PASSWORD environment variable is not set');
    return { error: 'Error de configuración del servidor' };
  }

  if (password === correctPassword) {
    // Generar un JWT firmado
    const token = await new SignJWT({ authenticated: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1y')
      .sign(JWT_SECRET);

    (await cookies()).set('home_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
    });
    redirect('/');
  } else {
    return { error: 'Contraseña incorrecta' };
  }
}
