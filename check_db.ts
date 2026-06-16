import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qjgftfzgugewmjygmbqp.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZ2Z0ZnpndWdld21qeWdtYnFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg0NDE3NCwiZXhwIjoyMDkzNDIwMTc0fQ.8G98qyFf6BRgskecPyv2NdfVY06DJtfU06XOkSDDWZA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProposals() {
  const { data: proposals } = await supabase.from('proposals').select('*');
  console.log('Proposals:', proposals.map(p => p.name));
}

checkProposals();
