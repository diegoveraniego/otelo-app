import { supabase } from '../supabase/client';

/**
 * Service for handling application notifications, 
 * specifically trade requests and alerts.
 */
export const notificationService = {
  /**
   * Fetches pending feeding trade requests for a specific member
   */
  async getPendingTrades(memberId: string) {
    const { data, error } = await supabase
      .from('feeding_trades')
      .select(`
        *,
        slot:feeding_slots(*),
        from_member:members!from_member_id(*)
      `)
      .eq('to_member_id', memberId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Fetches all notifications (thanks and trades) for a member
   */
  async getAllNotifications(memberId: string) {
    const [{ data: thanksData }, { data: tradeData }] = await Promise.all([
      supabase
        .from('thanks')
        .select('*, from_member:members!thanks_from_member_id_fkey(*), log:logs(*, chore:chores(*))')
        .eq('to_member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('color_trades')
        .select('*, from_member:members!color_trades_from_member_id_fkey(*), to_member:members!color_trades_to_member_id_fkey(*)')
        .eq('to_member_id', memberId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
    ]);

    return {
      thanks: (thanksData || []) as any[],
      trades: (tradeData || []) as any[]
    };
  },

  /**
   * Responds to a color trade request
   */
  async respondToColorTrade(tradeId: string, status: 'accepted' | 'declined', fromId: string, toId: string) {
    if (status === 'accepted') {
      // Execute the database function to swap colors
      const { error: swapError } = await supabase.rpc('swap_member_colors', {
        member_a_id: fromId,
        member_b_id: toId
      });
      if (swapError) throw swapError;

      // Decline other conflicting trades
      await supabase
        .from('color_trades')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .neq('id', tradeId)
        .or(`from_member_id.eq.${fromId},to_member_id.eq.${toId},from_member_id.eq.${toId},to_member_id.eq.${fromId}`)
        .eq('status', 'pending');
    }

    const { error } = await supabase
      .from('color_trades')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', tradeId);
    
    if (error) throw error;
  }
};
