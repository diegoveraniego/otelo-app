import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@mindfit.cl', // Un correo de contacto válido
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(request: Request) {
  // Uncomment and configure CRON_SECRET in Vercel to protect this route
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .gte('done_at', startOfDay.toISOString())
      .lte('done_at', endOfDay.toISOString());

    const completedCount = logs?.length || 0;
    const summaryText = `Hoy se completaron ${completedCount} tareas en la casa. ${completedCount > 0 ? '¡Gran trabajo en equipo! 👏' : 'Recuerden avanzar con las tareas pendientes. 💪'}`;

    const { data: subscriptions } = await supabase.from('push_subscriptions').select('*');

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No active subscriptions' });
    }

    const payload = JSON.stringify({
      title: 'Resumen Diario de Tareas 📋',
      body: summaryText,
    });

    const sendPromises = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };
      
      return webpush.sendNotification(pushSubscription, payload).catch((error) => {
        console.error('Error enviando notificación al endpoint', sub.endpoint, error);
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Eliminar suscripciones inválidas o expiradas
          return supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, message: `Sent notifications to ${subscriptions.length} devices.` });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
