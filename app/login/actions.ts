'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginWithHomePassword(formData: FormData) {
  const password = formData.get('password') as string;
  const correctPassword = process.env.HOME_PASSWORD;

  if (!correctPassword) {
    console.error('HOME_PASSWORD environment variable is not set');
    return { error: 'Error de configuración del servidor' };
  }

  if (password === correctPassword) {
    (await cookies()).set('home_auth_token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });
    redirect('/');
  } else {
    return { error: 'Contraseña incorrecta' };
  }
}
