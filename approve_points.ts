import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qjgftfzgugewmjygmbqp.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZ2Z0ZnpndWdld21qeWdtYnFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg0NDE3NCwiZXhwIjoyMDkzNDIwMTc0fQ.8G98qyFf6BRgskecPyv2NdfVY06DJtfU06XOkSDDWZA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function approvePoints() {
  const { data: chores, error: err1 } = await supabase.from('chores').select('id, name');
  const { data: votes, error: err2 } = await supabase.from('chore_votes').select('*');
  
  if (err1 || err2) {
    console.error(err1 || err2);
    return;
  }
  
  if (!chores || !votes) return;
  
  let updateCount = 0;
  
  for (const chore of chores) {
    const choreVotes = votes.filter((v: any) => v.chore_id === chore.id);
    if (choreVotes.length > 0) {
      const sum = choreVotes.reduce((acc: number, v: any) => acc + v.points, 0);
      const avg = Math.round(sum / choreVotes.length);
      
      const { error } = await supabase.from('chores').update({ points: avg }).eq('id', chore.id);
      if (error) {
        console.error(`Error updating ${chore.name}:`, error);
      } else {
        console.log(`Approved ${avg} points for chore: ${chore.name} based on ${choreVotes.length} votes`);
        updateCount++;
      }
    }
  }
  
  console.log(`Updated ${updateCount} chores.`);
}

approvePoints();
