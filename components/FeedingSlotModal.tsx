'use client';

import { useState, useEffect, useMemo } from 'react';
import { feedingService } from '@/lib/services/feedingService';
import { choreService } from '@/lib/services/choreService';
import { achievementService } from '@/lib/services/achievementService';
import { FeedingSlotWithDetails, Member, Pet } from '@/lib/types';
import { useUserStore } from '@/lib/store';
import {
  CheckCircle2, X, UserPlus, AlertTriangle, Clock,
  ArrowLeftRight, Trash2, Bell
} from 'lucide-react';
import Avatar from './Avatar';
import { triggerPushNotification } from '@/lib/pushUtils';
import {
  DAY_NAMES_FULL, SLOT_LABELS, isSlotOverdue,
  wasFedLate, formatFedTime, isSlotNow, isSlotToday,
  SLOT_HOURS
} from '@/lib/feedingUtils';

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

  // Reset view when opening or changing slot
  useEffect(() => {
    if (isOpen && currentUser?.home_id) {
      setView('main');
      setIsSubmitting(false);
      feedingService.getPets(currentUser.home_id).then(setPets).catch(console.error);
      feedingService.getMembers(currentUser.home_id).then(setMembers).catch(console.error);
    }
  }, [isOpen, slot?.id, currentUser?.home_id]);

  const selectedPet = useMemo(() => pets.find(p => p.id === slot?.pet_id), [pets, slot]);
  const isCurrentUserAssigned = currentUser?.id === slot?.assigned_to;
  const overdue = slot ? isSlotOverdue(slot) : false;
  const fedLate = slot ? wasFedLate(slot) : false;
  const slotIsNow = slot ? isSlotNow(slot) : false;
  const isToday = slot ? isSlotToday(slot) : false;
  const isReplacement = !!(slot?.fed_at && slot?.assigned_to && slot.fed_by !== slot.assigned_to);
  const dayName = slot ? DAY_NAMES_FULL[slot.day_of_week] : '';
  const slotLabel = slot ? SLOT_LABELS[slot.slot] : '';

  // Check if this is a future slot being marked early
  const isEarly = useMemo(() => {
    if (!slot || !isToday || slot.fed_at) return false;
    const hour = new Date().getHours();
    return hour < SLOT_HOURS[slot.slot].start;
  }, [slot, isToday]);

  if (!isOpen || !slot) return null;

  // ── Actions ──────────────────────────────────────────────────

  const wrapAction = async (action: () => Promise<void>, successView?: ModalView) => {
    setIsSubmitting(true);
    try {
      await action();
      if (successView) setView(successView);
      onRefresh();
    } catch (error: any) {
      console.error(error);
      alert('Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = () => wrapAction(async () => {
    if (!currentUser) throw new Error('Debes iniciar sesión');
    if (!slot.pet_id) throw new Error('ID de mascota faltante');
    
    await feedingService.signUp({
      pet_id: slot.pet_id,
      week_start: slot.week_start,
      day_of_week: slot.day_of_week,
      slot: slot.slot,
      assigned_to: currentUser.id,
      home_id: currentUser.home_id,
      id: slot.id
    });
  }, 'success');

  const handleMarkFed = () => wrapAction(async () => {
    if (!currentUser) throw new Error('Debes iniciar sesión');
    if (!slot.pet_id) throw new Error('ID de mascota faltante');

    if (!selectedPet) return;
    let choreName: string | null = null;
    if (selectedPet.type === 'dog') choreName = 'Dar comida y agua a Otelo';
    else if (selectedPet.type === 'cat') choreName = 'Dar comida y agua a Gatos';
    
    if (choreName) {
      const chores = await choreService.getChores(currentUser.home_id);
      const chore = chores.find(c => c.name === choreName);
      if (chore) {
        // Complete the chore and explicitly pass the slot as metadata!
        // The trigger will read this and perfectly assign it.
        await choreService.completeChore(chore.id, currentUser.id, currentUser.home_id, undefined, { slot: slot.slot });
        window.dispatchEvent(new CustomEvent('chore-logged'));
      } else {
        // Fallback if chore not found
        await feedingService.markAsFed({
          id: slot.id,
          pet_id: slot.pet_id,
          week_start: slot.week_start,
          day_of_week: slot.day_of_week,
          slot: slot.slot,
          fed_by: currentUser.id,
          home_id: currentUser.home_id
        });
      }
    }

    // Evaluate achievements asynchronously
    achievementService.evaluateAndUnlock(currentUser.id, currentUser.home_id).then(newlyUnlocked => {
      if (newlyUnlocked.length > 0) {
        window.dispatchEvent(new CustomEvent('achievements-unlocked', { detail: newlyUnlocked }));
      }
    }).catch(console.error);

  }, 'fed-success');

  const handleRequestTrade = (toMember: Member) => wrapAction(async () => {
    if (!currentUser || !slot.id) throw new Error('No se puede pedir trueque para un turno no guardado');
    await feedingService.createTrade(slot.id, currentUser.id, toMember.id, currentUser.home_id);
    
    triggerPushNotification({
      title: 'Solicitud de trueque 🔄',
      body: `${currentUser.name} te pide cubrir el turno de ${slotLabel} del ${dayName}`,
      targetMemberId: toMember.id,
      eventType: 'trade'
    });
    
    setView('main');
  });

  const handleUnassign = () => wrapAction(async () => {
    if (!slot || !slot.pet_id || !currentUser) return;
    await feedingService.signUp({
      pet_id: slot.pet_id,
      week_start: slot.week_start,
      day_of_week: slot.day_of_week,
      slot: slot.slot,
      assigned_to: null as any,
      home_id: currentUser.home_id,
      id: slot.id
    });
    onClose();
  });

  const handleSendNudge = () => wrapAction(async () => {
    if (!currentUser || !slot.assigned_to) return;
    await triggerPushNotification({
      title: '¡Turno de comida! 🐾',
      body: `${currentUser.name} te recuerda alimentar a ${selectedPet?.name || 'la mascota'} en el turno de la ${slotLabel.toLowerCase()}.`,
      targetMemberId: slot.assigned_to,
      eventType: 'nudge'
    });
    alert(`Recordatorio enviado a ${slot.assigned_member?.name || 'el responsable'} 🔔`);
    onClose();
  });

  // ── Render Helpers ───────────────────────────────────────────

  if (view === 'success' || view === 'fed-success') {
    const isFed = view === 'fed-success';
    return (
      <ModalWrapper onClose={onClose}>
        <div className="p-8 flex flex-col items-center justify-center text-center gap-3 animate-in zoom-in duration-300">
          <div className="text-5xl mb-2">{isFed ? '🐕' : ''}</div>
          <CheckCircle2 className="w-10 h-10 text-green-500" />
          <h2 className="text-xl font-bold text-[#1E1E1E] dark:text-white">
            {isFed ? `¡${selectedPet?.name || 'Mascota'} alimentada!` : '¡Anotado!'}
          </h2>
          <p className="text-[#1E1E1E]/60 dark:text-white/60 text-sm">
            {isFed 
              ? `Gracias por cuidar a ${selectedPet?.name || 'la mascota'} ✨`
              : `Quedas encargado/a del turno de ${slotLabel} del ${dayName}.`
            }
          </p>
        </div>
      </ModalWrapper>
    );
  }

  if (view === 'trade-pick') {
    const eligibleMembers = members.filter(m => m.id !== currentUser?.id && m.id !== slot.assigned_to);
    return (
      <ModalWrapper onClose={() => setView('main')}>
        <div className="p-5">
          <h2 className="text-lg font-bold text-[#1E1E1E] dark:text-white mb-1">Pedir trueque</h2>
          <p className="text-xs text-[#1E1E1E]/50 dark:text-white/50 mb-4">
            ¿A quién le pedirías que te cubra este turno?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {eligibleMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => handleRequestTrade(m)}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-[#E5E6E6] dark:border-[#3D3D3D] hover:bg-[#FAFAFA] dark:hover:bg-[#3D3D3D] transition-colors"
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

  return (
    <ModalWrapper onClose={onClose}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-4xl mb-1">{slot.slot === 'morning' ? '🌅' : '🌆'}</div>
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
              <AlertTriangle className="w-3 h-3" /> Turno atrasado
            </span>
          )}
        </div>

        {/* Status Card */}
        <div className={`p-4 rounded-2xl border transition-colors ${
          slot.fed_at 
            ? isReplacement
              ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
              : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30'
            : 'bg-[#FAFAFA] dark:bg-[#2A2A2A] border-[#E5E6E6] dark:border-[#3D3D3D]'
        }`}>
          {slot.fed_at ? (
            <div className="space-y-3">
              {(slot.fed_members && slot.fed_members.length > 0 ? slot.fed_members : [slot.fed_member]).map((fedM, idx) => {
                if (!fedM) return null;
                const localIsReplacement = !!(slot.assigned_to && fedM.id !== slot.assigned_to);
                return (
                  <div key={`${fedM.id}-${idx}`} className="flex items-center gap-3">
                    <Avatar member={fedM} className="w-10 h-10" />
                    <div>
                      <p className="text-sm font-bold text-[#1E1E1E] dark:text-white">
                        {localIsReplacement ? `Reemplazado por ${fedM.name}` : `Alimentado por ${fedM.name}`}
                      </p>
                      <p className="text-xs text-[#1E1E1E]/50 dark:text-white/50">
                        {(fedM as any).fed_at ? formatFedTime((fedM as any).fed_at) : formatFedTime(slot.fed_at!)} {fedLate && '(tarde)'}
                      </p>
                    </div>
                    <CheckCircle2 className={`ml-auto w-5 h-5 ${localIsReplacement ? 'text-amber-500' : 'text-green-500'}`} />
                  </div>
                );
              })}
              {isReplacement && slot.assigned_member && (
                <div className="pt-2 border-t border-[#E5E6E6]/60 dark:border-[#3D3D3D]/60 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Turno asignado originalmente a {slot.assigned_member.name}
                </div>
              )}
            </div>
          ) : slot.assigned_to ? (
            <div className="flex items-center gap-3">
              <Avatar member={slot.assigned_member!} className="w-10 h-10" />
              <div>
                <p className="text-sm font-bold text-[#1E1E1E] dark:text-white">{slot.assigned_member?.name}</p>
                <p className="text-xs text-[#1E1E1E]/50 dark:text-white/50 font-medium">Responsable del turno</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2 text-[#1E1E1E]/40 dark:text-white/30">
              <PlusIcon className="w-8 h-8 mb-1 opacity-20" />
              <p className="text-xs font-medium">Turno disponible</p>
            </div>
          )}
        </div>
 
        {/* Action Buttons */}
        <div className="grid gap-2">
          {isToday && (
            <>
              {isEarly && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl flex items-start gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    Aún es temprano para el turno de la {slotLabel.toLowerCase()}. 
                    Si le estás dando la comida que faltaba de la mañana, asegúrate de marcar el turno de la mañana en su lugar.
                  </p>
                </div>
              )}
              <button
                onClick={handleMarkFed}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#26A269] hover:bg-[#1E8254] text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                {isSubmitting ? 'Guardando...' : slot.fed_at ? 'Alimentar otra vez' : 'Marcar como alimentado'}
              </button>
            </>
          )}

          {!slot.assigned_to && !slot.fed_at && (
            <button
              onClick={handleSignUp}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#3584E4] hover:bg-[#1C71D8] text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <UserPlus className="w-5 h-5" />
              Anotarme para este turno
            </button>
          )}

          {slot.assigned_to && !slot.fed_at && currentUser?.id !== slot.assigned_to && (isToday || overdue) && (
            <button
              onClick={handleSendNudge}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Bell className="w-4 h-4 animate-bounce" />
              {isSubmitting ? 'Enviando...' : 'Enviar Recordatorio (Nudge)'}
            </button>
          )}

          {isCurrentUserAssigned && !slot.fed_at && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setView('trade-pick')}
                className="flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all"
              >
                <ArrowLeftRight className="w-4 h-4" /> Trueque
              </button>
              <button
                onClick={handleUnassign}
                className="flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
              >
                <Trash2 className="w-4 h-4" /> Salir
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white dark:bg-[#303030] rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end p-4 pb-0">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3D3D3D] text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
