import { supabase } from '../supabase/client';
import { Proposal, ProposalVote } from '../types';

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
    return data as Proposal[];
  },

  /**
   * Fetches all votes for a list of proposals
   */
  async getVotes(proposalIds: string[]) {
    if (proposalIds.length === 0) return [];
    
    const { data, error } = await supabase
      .from('proposal_votes')
      .select('*, member:members(*)')
      .in('proposal_id', proposalIds);

    if (error) throw error;
    return data as any[];
  },

  /**
   * Toggles a vote on a proposal (adds if missing, removes if exists)
   */
  async toggleVote(proposalId: string, memberId: string, homeId: string) {
    const { data: existing } = await supabase
      .from('proposal_votes')
      .select('id')
      .eq('proposal_id', proposalId)
      .eq('member_id', memberId)
      .single();

    if (existing) {
      const { error } = await supabase.from('proposal_votes').delete().eq('id', existing.id);
      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase.from('proposal_votes').insert({
        proposal_id: proposalId,
        member_id: memberId,
        home_id: homeId
      });
      if (error) throw error;
      return true;
    }
  },

  /**
   * Approves a proposal: marks as approved. 
   * A DB trigger (013_proposal_trigger) handles the automatic chore creation.
   */
  async approveProposal(proposalId: string) {
    const { error } = await supabase
      .from('proposals')
      .update({ status: 'approved' })
      .eq('id', proposalId);
    if (error) throw error;
  },

  /**
   * Rejects a proposal (expired)
   */
  async rejectProposal(proposalId: string) {
    const { error } = await supabase
      .from('proposals')
      .update({ status: 'rejected' })
      .eq('id', proposalId);
    if (error) throw error;
  },

  /**
   * Creates a new proposal
   */
  async createProposal(payload: Partial<Proposal> & { home_id: string }) {
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        ...payload,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
