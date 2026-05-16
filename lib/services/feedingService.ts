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
    home_id: string;
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
    home_id: string;
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
          fed_by: payload.fed_by,
          home_id: payload.home_id
        }, { onConflict: 'pet_id,week_start,day_of_week,slot' });
    if (error) throw error;
    }
  },

  /**
   * Creates a trade request for a feeding slot
   */
  async createTrade(slotId: string, fromId: string, toId: string, homeId: string) {
    const { error } = await supabase
      .from('feeding_trades')
      .insert({
        slot_id: slotId,
        from_member_id: fromId,
        to_member_id: toId,
        status: 'pending',
        home_id: homeId
      });
    if (error) throw error;
  }
};
