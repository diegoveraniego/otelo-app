export async function triggerPushNotification({
  title,
  body,
  targetMemberId,
  sourceMemberId,
  eventType
}: {
  title: string;
  body: string;
  targetMemberId?: string;
  sourceMemberId?: string;
  eventType: 'thanks' | 'chore' | 'trade';
}) {
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, targetMemberId, sourceMemberId, eventType })
    });
  } catch (error) {
    console.error('Error triggering push:', error);
  }
}
