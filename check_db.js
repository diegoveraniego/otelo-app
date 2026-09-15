import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjgftfzgugewmjygmbqp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZ2Z0ZnpndWdld21qeWdtYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQxNzQsImV4cCI6MjA5MzQyMDE3NH0.1ZXLh5ujxFlrfjU93WUQKBBXjWWOWKib-5e0prHiDw4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('chores').select('*').eq('name', 'Limpiar Living');
  if (error) console.error(error);
  console.log(data);
}

main();
