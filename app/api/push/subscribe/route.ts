import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { subscription, memberId } = await request.json();

    if (!subscription || !memberId) {
      return NextResponse.json({ error: 'Missing subscription or memberId' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { keys, endpoint } = subscription;

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        member_id: memberId,
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      }, { onConflict: 'endpoint' });

    if (error) {
      console.error('Supabase error inserting subscription:', error);
      return NextResponse.json({ error: 'Failed to insert subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error saving subscription:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
