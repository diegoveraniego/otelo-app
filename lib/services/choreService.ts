import { supabase } from '../supabase/client';
import { Chore, LogWithDetails, Member } from '../types';

/**
 * Service for home chores and logging.
 * Centralizes complex queries like fetching logs with member/chore details.
 */
export const choreService = {
  /**
   * Fetches the full list of chores for a specific home
   */
  async getChores(homeId?: string) {
    let query = supabase.from('chores').select('*').order('name');
    if (homeId) query = query.eq('home_id', homeId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Chore[];
  },

  /**
   * Fetches recent logs with member and chore information for a specific home
   */
  async getRecentLogs(homeId: string, limit = 30) {
    const { data, error } = await supabase
      .from('logs')
      .select(`
        *,
        member:members(*),
        chore:chores(*)
      `)
      .eq('home_id', homeId)
      .order('done_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as unknown as LogWithDetails[];
  },

  /**
   * Fetches the latest log for each chore to calculate "last done" status for a specific home
   */
  async getLatestLogs(homeId?: string) {
    let query = supabase.from('logs').select('chore_id, done_at');
    if (homeId) query = query.eq('home_id', homeId);
    
    const { data, error } = await query.order('done_at', { ascending: false });

    if (error) throw error;

    // Build a map of choreId -> latest date
    const latestMap = new Map<string, string>();
    (data ?? []).forEach(log => {
      if (!latestMap.has(log.chore_id)) {
        latestMap.set(log.chore_id, log.done_at);
      }
    });
    return latestMap;
  },

  /**
   * Records a chore as completed
   */
  async completeChore(choreId: string, memberId: string, homeId: string, doneAt?: string) {
    const { error } = await supabase.from('logs').insert({
      chore_id: choreId,
      member_id: memberId,
      home_id: homeId,
      done_at: doneAt || new Date().toISOString()
    });
    if (error) throw error;
  },

  /**
   * Deletes a recent log (useful for fixing mistakes)
   */
  async deleteLog(logId: string) {
    const { error } = await supabase.from('logs').delete().eq('id', logId);
    if (error) throw error;
  },

  /**
   * Fetches thanks given by a specific member for a list of logs
   */
  async getMyThanks(memberId: string, logIds: string[], homeId?: string) {
    let query = supabase
      .from('thanks')
      .select('log_id')
      .eq('from_member_id', memberId)
      .in('log_id', logIds);
      
    if (homeId) query = query.eq('home_id', homeId);
    
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(t => t.log_id);
  },

  /**
   * Gives thanks for a chore completion
   */
  async giveThanks(logId: string, fromMemberId: string, toMemberId: string, homeId: string) {
    const { error } = await supabase.from('thanks').insert({
      log_id: logId,
      from_member_id: fromMemberId,
      to_member_id: toMemberId,
      home_id: homeId,
    });
    if (error) throw error;
  }
};
