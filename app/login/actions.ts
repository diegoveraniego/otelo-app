'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginWithHomePassword(formData: FormData) {
  const password = formData.get('password') as string;
  const correctPassword = process.env.HOME_PASSWORD || 'otelo123';

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
