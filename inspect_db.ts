import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qjgftfzgugewmjygmbqp.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZ2Z0ZnpndWdld21qeWdtYnFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg0NDE3NCwiZXhwIjoyMDkzNDIwMTc0fQ.8G98qyFf6BRgskecPyv2NdfVY06DJtfU06XOkSDDWZA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectFeeding() {
  const { data: logs, error: err1 } = await supabase.from('logs').select('id, member_id, chore_id, done_at').order('done_at', { ascending: false }).limit(20);
  
  const { data: slots, error: err2 } = await supabase.from('feeding_slots').select('*').order('week_start', { ascending: false }).order('day_of_week', { ascending: false }).limit(20);
  
  if (err1) console.error("ERR1:", err1);
  if (err2) console.error("ERR2:", err2);
  
  console.log("Recent Logs:", JSON.stringify(logs, null, 2));
  console.log("Recent Slots:", JSON.stringify(slots, null, 2));
}

inspectFeeding();
