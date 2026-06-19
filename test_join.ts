import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qjgftfzgugewmjygmbqp.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZ2Z0ZnpndWdld21qeWdtYnFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg0NDE3NCwiZXhwIjoyMDkzNDIwMTc0fQ.8G98qyFf6BRgskecPyv2NdfVY06DJtfU06XOkSDDWZA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testJoin() {
  const { data, error } = await supabase.from('logs').select('member_id, chore_id, chores(points)').limit(5);
  console.log(data, error);
}

testJoin();
