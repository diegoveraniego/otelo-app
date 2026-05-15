import { supabase } from '../supabase/client';
import { Proposal, Vote } from '../types';

/**
 * Service for managing family proposals and voting.
 * Centralizes logic for fetching active proposals and casting votes.
 */
export const proposalService = {
  /**
   * Fetches all active (pending) proposals with author details
   */
  async getActiveProposals() {
    const { data, error } = await supabase
      .from('proposals')
      .select('*, author:members(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any[];
  },

  /**
   * Fetches all votes for a list of proposals
   */
  async getVotes(proposalIds: string[]) {
    if (proposalIds.length === 0) return [];
    
    const { data, error } = await supabase
      .from('votes')
      .select('*, member:members(*)')
      .in('proposal_id', proposalIds);

    if (error) throw error;
    return data as any[];
  },

  /**
   * Casts or updates a vote on a proposal
   */
  async castVote(proposalId: string, memberId: string, voteType: 'up' | 'down') {
    const { error } = await supabase
      .from('votes')
      .upsert({
        proposal_id: proposalId,
        member_id: memberId,
        vote_type: voteType,
        updated_at: new Date().toISOString()
      }, { onConflict: 'proposal_id,member_id' });

    if (error) throw error;
  },

  /**
   * Creates a new proposal
   */
  async createProposal(title: string, description: string, memberId: string) {
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        title,
        description,
        author_id: memberId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
