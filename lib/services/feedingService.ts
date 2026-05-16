import { supabase } from '../supabase/client';
import { FeedingSlotWithDetails, Member } from '../types';
import { addDays, isSameDay, parseISO, getHours } from 'date-fns';
import { choreService } from './choreService';

/**
 * Service to handle all pet feeding related database operations.
 * Centralizing this reduces technical debt and makes error handling consistent.
 */
export const feedingService = {
  /**
   * Fetches all members and caches them if needed (future optimization)
   */
  async getMembers() {
    const { data, error } = await supabase.from('members').select('*').order('name');
    if (error) throw error;
    return data as Member[];
  },

  /**
   * Fetches all pets
   */
  async getPets() {
    const { data, error } = await supabase.from('pets').select('*').order('name');
    if (error) throw error;
    return data;
  },

  /**
   * Fetches slots for a specific week and pet, enriched with member details
   */
  async getWeeklySlots(weekStart: string, petId: string) {
    const { data: slotsData, error: slotsError } = await supabase
      .from('feeding_slots')
      .select('*')
      .eq('week_start', weekStart)
      .eq('pet_id', petId)
      .order('day_of_week')
      .order('slot');

    if (slotsError) throw slotsError;
    
    const members = await this.getMembers();
    const memberMap = new Map(members.map(m => [m.id, m]));

    // 1. Initial enriched slots from feeding_slots table
    const enriched: FeedingSlotWithDetails[] = (slotsData ?? []).map((s) => ({
      ...s,
      assigned_member: s.assigned_to ? memberMap.get(s.assigned_to) ?? null : null,
      fed_member: s.fed_by ? memberMap.get(s.fed_by) ?? null : null,
    }));

    // 2. Integration with historical logs for "past fed" visibility
    try {
      const pets = await this.getPets();
      const pet = pets.find(p => p.id === petId);
      const chores = await choreService.getChores();
      
      let choreName: string | null = null;
      if (pet?.name.toLowerCase().includes('otelo')) choreName = 'Dar comida y agua a Otelo';
      else if (pet?.type === 'cat' || pet?.name.toLowerCase().includes('gato')) choreName = 'Dar comida y agua a Gatos';

      const chore = chores.find(c => c.name === choreName);
      
      if (chore) {
        const start = parseISO(weekStart);
        const end = addDays(start, 7);
        
        const { data: logs } = await supabase
          .from('logs')
          .select('*')
          .eq('chore_id', chore.id)
          .gte('done_at', start.toISOString())
          .lt('done_at', end.toISOString());

        if (logs && logs.length > 0) {
          logs.forEach(log => {
            const logDate = parseISO(log.done_at);
            const dayOfWeek = (logDate.getDay() + 6) % 7; // Convert to 0=Mon...6=Sun
            const hour = getHours(logDate);
            const slot: 'morning' | 'evening' = hour < 15 ? 'morning' : 'evening';

            // Find if there's already a slot record for this day/slot
            let existing = enriched.find(s => s.day_of_week === dayOfWeek && s.slot === slot);
            
            if (existing) {
              if (!existing.fed_at) {
                existing.fed_at = log.done_at;
                existing.fed_by = log.member_id;
                existing.fed_member = memberMap.get(log.member_id) ?? null;
              }
            } else {
              // Create a "virtual" slot from the log
              enriched.push({
                id: `log-${log.id}`,
                pet_id: petId,
                week_start: weekStart,
                day_of_week: dayOfWeek,
                slot: slot,
                assigned_to: null,
                assigned_at: null,
                fed_at: log.done_at,
                fed_by: log.member_id,
                fed_member: memberMap.get(log.member_id) ?? null,
                assigned_member: null
              });
            }
          });
        }
      }
    } catch (logErr) {
      console.error('Error enriching slots with logs:', logErr);
    }

    return enriched.sort((a, b) => a.day_of_week - b.day_of_week || a.slot.localeCompare(b.slot));
  },

  /**
   * Sign up a member for a slot
   */
  async signUp(payload: {
    pet_id: string;
    week_start: string;
    day_of_week: number;
    slot: string;
    assigned_to: string;
    id?: string;
  }) {
    // Clean payload: remove empty ID if virtual
    const cleanPayload = { ...payload };
    if (cleanPayload.id && cleanPayload.id.length < 10) delete cleanPayload.id;

    const { data, error } = await supabase
      .from('feeding_slots')
      .upsert({
        ...cleanPayload,
        assigned_at: new Date().toISOString(),
      }, { onConflict: 'pet_id,week_start,day_of_week,slot' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark a slot as fed
   */
  async markAsFed(payload: {
    id?: string;
    pet_id: string;
    week_start: string;
    day_of_week: number;
    slot: string;
    fed_by: string;
  }) {
    // Only allow marking as fed for today
    const monday = new Date(payload.week_start + 'T00:00:00');
    const slotDate = addDays(monday, payload.day_of_week);
    if (!isSameDay(new Date(), slotDate)) {
      throw new Error('Solo se puede marcar como alimentado para el día de hoy');
    }

    const fed_at = new Date().toISOString();
    
    if (payload.id && payload.id.length > 10) {
      const { error } = await supabase
        .from('feeding_slots')
        .update({ fed_at, fed_by: payload.fed_by })
        .eq('id', payload.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('feeding_slots')
        .upsert({
          pet_id: payload.pet_id,
          week_start: payload.week_start,
          day_of_week: payload.day_of_week,
          slot: payload.slot,
          fed_at,
          fed_by: payload.fed_by
        }, { onConflict: 'pet_id,week_start,day_of_week,slot' });
    if (error) throw error;
    }
  },

  /**
   * Creates a trade request for a feeding slot
   */
  async createTrade(slotId: string, fromId: string, toId: string) {
    const { error } = await supabase
      .from('feeding_trades')
      .insert({
        slot_id: slotId,
        from_member_id: fromId,
        to_member_id: toId,
        status: 'pending'
      });
    if (error) throw error;
  }
};
