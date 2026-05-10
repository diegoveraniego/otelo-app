import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@mindfit.cl',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const { title, body, targetMemberId, sourceMemberId, eventType } = await request.json();

    if (!title || !body || !eventType) {
      return NextResponse.json({ error: 'Missing title, body or eventType' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase.from('push_subscriptions').select('*, member:members(notification_prefs)');

    if (targetMemberId) {
      query = query.eq('member_id', targetMemberId);
    } else if (sourceMemberId) {
      query = query.neq('member_id', sourceMemberId);
    }

    const { data: subscriptions } = await query;

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscriptions found' });
    }

    const filteredSubscriptions = subscriptions.filter(sub => {
      // Handle array or object since foreign key could return array in some setups
      const member = Array.isArray(sub.member) ? sub.member[0] : sub.member;
      const prefs = member?.notification_prefs;
      if (!prefs) return true;
      
      if (eventType === 'thanks' && prefs.thanks === false) return false;
      if (eventType === 'chore' && prefs.chores === false) return false;
      if (eventType === 'trade' && prefs.trade === false) return false;
      
      return true;
    });

    if (filteredSubscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscriptions after preference filtering' });
    }

    const payload = JSON.stringify({ title, body });

    const sendPromises = filteredSubscriptions.map((sub) => {
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
          return supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, message: `Sent to ${subscriptions.length} devices.` });
  } catch (error) {
    console.error('Push send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
