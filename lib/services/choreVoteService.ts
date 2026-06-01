import { supabase } from '../supabase/client';
import { ChoreVote } from '../types';

export const choreVoteService = {
  async getVotes(homeId: string) {
    const { data, error } = await supabase
      .from('chore_votes')
      .select('*')
      .eq('home_id', homeId);
    if (error) throw error;
    return data as ChoreVote[];
  },

  async vote(choreId: string, memberId: string, homeId: string, points: number) {
    // Upsert vote
    const { error } = await supabase
      .from('chore_votes')
      .upsert({
        chore_id: choreId,
        member_id: memberId,
        home_id: homeId,
        points: points,
      }, { onConflict: 'chore_id,member_id' });
    
    if (error) throw error;
    
    // Check if we need to apply the average
    // Get all votes for this chore
    const { data: allVotes } = await supabase
      .from('chore_votes')
      .select('points')
      .eq('chore_id', choreId);
      
    // Assuming 7 members, threshold is 5 (per user's request: "necesiten 5/7 para aprobarse")
    if (allVotes && allVotes.length >= 5) {
      const sum = allVotes.reduce((acc, v) => acc + v.points, 0);
      const avg = Math.round(sum / allVotes.length);
      
      await supabase
        .from('chores')
        .update({ points: avg })
        .eq('id', choreId);
    }
  }
};
