'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { FeedingSlotWithDetails, Member, Pet } from '@/lib/types';

type Props = {
  slot: FeedingSlotWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
};

type ModalView = 'main' | 'trade-pick' | 'success' | 'fed-success';

export default function FeedingSlotModal({ slot, isOpen, onClose, onRefresh }: Props) {
  const { currentUser } = useUserStore();
  const [view, setView] = useState<ModalView>('main');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);

  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    if (isOpen) {
      setView('main');
      setIsSubmitting(false);
      fetchPets();
    }
  }, [isOpen, slot]);

  useEffect(() => {
    if (isOpen) fetchMembers();
  }, [isOpen]);

  const fetchMembers = async () => {
    const { data } = await supabase.from('members').select('*').order('name');
    if (data) setMembers(data);
  };

  const fetchPets = async () => {
    const { data } = await supabase.from('pets').select('*');
    if (data) setPets(data);
  };

  if (!isOpen || !slot) return null;

  const selectedPet = pets.find(p => p.id === slot.pet_id);
  const isCurrentUser = currentUser?.id === slot.assigned_to;
  const overdue = isSlotOverdue(slot);
  const fedLate = wasFedLate(slot);
  const slotIsNow = isSlotNow(slot);
  const dayName = DAY_NAMES_FULL[slot.day_of_week];
  const slotLabel = SLOT_LABELS[slot.slot];

  // ── Actions ──────────────────────────────────────────────────

  const handleSignUp = async () => {
    if (!currentUser) {
      window.dispatchEvent(new CustomEvent('open-user-modal'));
      onClose();
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase
      .from('feeding_slots')
      .upsert({
        pet_id: slot.pet_id,
        week_start: slot.week_start,
        day_of_week: slot.day_of_week,
        slot: slot.slot,
        assigned_to: currentUser.id,
        assigned_at: new Date().toISOString(),
      }, { onConflict: 'pet_id,week_start,day_of_week,slot' });
    setIsSubmitting(false);
    if (!error) { setView('success'); onRefresh(); }
  };

  const handleMarkFed = async () => {
    if (!currentUser) {
      window.dispatchEvent(new CustomEvent('open-user-modal'));
      onClose();
      return;
    }
    setIsSubmitting(true);
    // If slot doesn't exist yet, we need to create it with pet_id
    if (!slot.id) {
       const { data, error } = await supabase
        .from('feeding_slots')
        .upsert({
          pet_id: slot.pet_id,
          week_start: slot.week_start,
          day_of_week: slot.day_of_week,
          slot: slot.slot,
          fed_at: new Date().toISOString(),
          fed_by: currentUser.id
        }, { onConflict: 'pet_id,week_start,day_of_week,slot' })
        .select()
        .single();
       if (!error) { setView('fed-success'); onRefresh(); }
    } else {
      const { error } = await supabase
        .from('feeding_slots')
        .update({ fed_at: new Date().toISOString(), fed_by: currentUser.id })
        .eq('id', slot.id);
      if (!error) { setView('fed-success'); onRefresh(); }
    }
    setIsSubmitting(false);
  };

  const handleUnassign = async () => {
    if (!currentUser || !isCurrentUser) return;
    setIsSubmitting(true);
    await supabase
      .from('feeding_slots')
      .update({ assigned_to: null, assigned_at: null })
      .eq('id', slot.id);
    setIsSubmitting(false);
    onRefresh();
    onClose();
  };

  const handleRequestTrade = async (toMember: Member) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    await supabase.from('feeding_trades').insert({
      slot_id: slot.id,
      from_member_id: currentUser.id,
      to_member_id: toMember.id,
    });
    setIsSubmitting(false);
    onRefresh();
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────

  if (view === 'success') {
    return (
      <ModalWrapper onClose={onClose}>
        <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
          <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in" />
          <h2 className="text-xl font-bold text-[#1E1E1E] dark:text-white">¡Anotado!</h2>
          <p className="text-[#1E1E1E]/60 dark:text-white/60 text-sm">
            Quedas encargado/a del turno de <strong>{slotLabel}</strong> del <strong>{dayName}</strong>.
          </p>
        </div>
      </ModalWrapper>
    );
  }

  if (view === 'fed-success') {
    return (
      <ModalWrapper onClose={onClose}>
        <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
          <div className="text-5xl">🐕</div>
          <CheckCircle2 className="w-10 h-10 text-green-500 animate-in zoom-in" />
          <h2 className="text-xl font-bold text-[#1E1E1E] dark:text-white">
            ¡{selectedPet?.name || 'La mascota'} ya comió!
          </h2>
          <p className="text-[#1E1E1E]/60 dark:text-white/60 text-sm">Gracias, {currentUser?.name} 🐾</p>
        </div>
      </ModalWrapper>
    );
  }

  if (view === 'trade-pick') {
    const eligibleMembers = members.filter(
      (m) => m.id !== currentUser?.id && m.id !== slot.assigned_to
    );
    return (
      <ModalWrapper onClose={() => setView('main')}>
        <div className="p-5">
          <h2 className="text-lg font-bold text-[#1E1E1E] dark:text-white mb-1">Pedir trueque</h2>
          <p className="text-xs text-[#1E1E1E]/50 dark:text-white/50 mb-4">
            {slotLabel} del {dayName} — ¿A quién le pedirías que te cubra?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {eligibleMembers.map((m) => (
              <button
                key={m.id}
                disabled={isSubmitting}
                onClick={() => handleRequestTrade(m)}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-[#E5E6E6] dark:border-[#3D3D3D] hover:bg-[#FAFAFA] dark:hover:bg-[#3D3D3D] transition-colors disabled:opacity-50"
                style={{ borderBottomColor: m.color, borderBottomWidth: 3 }}
              >
                <Avatar member={m} className="w-10 h-10 text-base mb-2" />
                <span className="text-sm font-medium text-[#1E1E1E] dark:text-white">{m.name}</span>
              </button>
            ))}
          </div>
        </div>
      </ModalWrapper>
    );
  }

  // ── Main view ─────────────────────────────────────────────────
  return (
    <ModalWrapper onClose={onClose}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-4xl">{slot.slot === 'morning' ? '🌅' : '🌆'}</div>
          <h2 className="text-lg font-bold text-[#1E1E1E] dark:text-white">
            {slotLabel} — {dayName}
          </h2>
          {slotIsNow && !slot.fed_at && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
              <Clock className="w-3 h-3" /> Turno activo ahora
            </span>
          )}
          {overdue && !slot.fed_at && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full animate-pulse">
              <AlertTriangle className="w-3 h-3" /> Turno vencido sin marcar
            </span>
          )}
        </div>

        {/* Status */}
        {slot.fed_at ? (
          // ── Already fed ──────────────────────────────────────
          <div className={`flex items-center gap-3 p-3 rounded-xl ${fedLate
            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40'
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40'
          }`}>
            {slot.fed_member && <Avatar member={slot.fed_member} className="w-10 h-10 text-base" />}
            <div>
              <p className="text-sm font-semibold text-[#1E1E1E] dark:text-white">
                {slot.fed_member?.name ?? 'Alguien'} le dio comida
              </p>
              <p className={`text-xs ${fedLate ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                {formatFedTime(slot.fed_at)}
                {fedLate && ' (fuera del turno — ¡igual cuenta! ✨)'}
              </p>
            </div>
            {fedLate
              ? <CheckCircle2 className="ml-auto w-5 h-5 text-amber-500 shrink-0" />
              : <CheckCircle2 className="ml-auto w-5 h-5 text-green-500 shrink-0" />
            }
          </div>
        ) : slot.assigned_to ? (
          // ── Assigned, not fed yet ─────────────────────────────
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#2A2A2A] border border-[#E5E6E6] dark:border-[#3D3D3D]">
            {slot.assigned_member && <Avatar member={slot.assigned_member} className="w-10 h-10 text-base" />}
            <div>
              <p className="text-sm font-semibold text-[#1E1E1E] dark:text-white">
                {slot.assigned_member?.name ?? '—'}
              </p>
              <p className="text-xs text-[#1E1E1E]/50 dark:text-white/50">Encargado/a de este turno</p>
            </div>
          </div>
        ) : (
          // ── No one assigned ───────────────────────────────────
          <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-[#E5E6E6] dark:border-[#3D3D3D]">
            <div className="w-10 h-10 rounded-full bg-[#E5E6E6] dark:bg-[#3D3D3D] flex items-center justify-center text-[#1E1E1E]/30 dark:text-white/30">
              ?
            </div>
            <p className="text-sm text-[#1E1E1E]/50 dark:text-white/50">Nadie se ha anotado aún</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Mark as fed (always available if not fed yet) */}
          {!slot.fed_at && (
            <button
              onClick={handleMarkFed}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <span className="text-lg">🐾</span>
              {isSubmitting ? 'Guardando...' : 'Ya le di de comer'}
            </button>
          )}

          {/* Sign up (if no one assigned) */}
          {!slot.assigned_to && !slot.fed_at && (
            <button
              onClick={handleSignUp}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#3584E4] hover:bg-[#1C71D8] text-white font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Anotarme para este turno'}
            </button>
          )}

          {/* Trade (only if current user is assigned) */}
          {isCurrentUser && !slot.fed_at && (
            <button
              onClick={() => setView('trade-pick')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-sm"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Pedir que me cubran
            </button>
          )}

          {/* Unassign (only current user can remove themselves) */}
          {isCurrentUser && !slot.fed_at && (
            <button
              onClick={handleUnassign}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 dark:text-red-400 font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Desanotarme
            </button>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white dark:bg-[#303030] rounded-2xl shadow-xl border border-[#E5E6E6] dark:border-[#3D3D3D] overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex justify-end p-3 pb-0">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#E5E6E6] dark:hover:bg-[#3D3D3D] text-[#1E1E1E]/50 dark:text-white/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
