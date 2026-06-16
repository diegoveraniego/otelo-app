import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qjgftfzgugewmjygmbqp.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZ2Z0ZnpndWdld21qeWdtYnFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg0NDE3NCwiZXhwIjoyMDkzNDIwMTc0fQ.8G98qyFf6BRgskecPyv2NdfVY06DJtfU06XOkSDDWZA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAssigned() {
  // Let's get Pepa (Josefa)
  const { data: members } = await supabase.from('members').select('id, name').ilike('name', '%josefa%');
  if (!members || members.length === 0) return;
  const josefa = members[0];
  
  const { data: slots } = await supabase.from('feeding_slots').select('*').eq('assigned_to', josefa.id);
  console.log(`Josefa is assigned to ${slots?.length} slots`);
  console.log(slots);
}
checkAssigned();
