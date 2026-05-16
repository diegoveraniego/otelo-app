'use server';

import { supabase } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const onboardingSchema = z.object({
  homeName: z.string().min(2, 'El nombre del hogar es muy corto'),
  members: z.array(z.object({
    name: z.string().min(1, 'Nombre requerido'),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido'),
    pin: z.string().length(4, 'El PIN debe tener 4 dígitos'),
    role: z.enum(['admin', 'member', 'organizator'])
  })).min(1, 'Debe haber al menos un miembro'),
  pets: z.array(z.object({
    name: z.string().min(1, 'Nombre requerido'),
    type: z.string().min(1, 'Tipo requerido')
  })),
  chores: z.array(z.object({
    name: z.string().min(1, 'Nombre requerido'),
    emoji: z.string(),
    category: z.string(),
    threshold_days: z.number().min(1)
  })).min(1, 'Debe haber al menos una tarea')
});

export async function submitOnboarding(formData: z.infer<typeof onboardingSchema>) {
  // Validate data
  const validatedData = onboardingSchema.parse(formData);

  // Call the RPC
  const { data: homeId, error } = await supabase.rpc('onboard_home', {
    p_home_name: validatedData.homeName,
    p_members: validatedData.members,
    p_pets: validatedData.pets,
    p_chores: validatedData.chores
  });

  if (error) {
    console.error('Error in onboarding RPC:', error);
    throw new Error('No se pudo crear el hogar. Inténtalo de nuevo.');
  }

  // Set home_id cookie
  (await cookies()).set('home_id', homeId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
    sameSite: 'lax',
  });

  // Redirect to dashboard
  redirect('/'); 
}
