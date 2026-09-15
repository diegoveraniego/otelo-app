'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Chore, Member } from '@/lib/types';
import { useUserStore } from '@/lib/store';
import { AlertCircle, CheckCircle2, Users, Check } from 'lucide-react';
import { triggerPushNotification } from '@/lib/pushUtils';
import { choreService } from '@/lib/services/choreService';
import { achievementService } from '@/lib/services/achievementService';
import Avatar from './Avatar';

type Subtask = { name: string; points: number };

type Props = {
  chore: Chore | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function ConfirmChoreModal({ chore, isOpen, onClose }: Props) {
  const { currentUser } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customDateOffset, setCustomDateOffset] = useState<number>(0);
  const [customTime, setCustomTime] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Subtasks
  const [selectedSubtasks, setSelectedSubtasks] = useState<string[]>([]);

  // Co-op
  const [showCoOp, setShowCoOp] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [coMembers, setCoMembers] = useState<string[]>([]);

  const isPasto = chore?.name === 'Cortar Pasto';
  const subtasks: Subtask[] = (chore as any)?.subtasks ?? [];
  const hasSubtasks = subtasks.length > 0;

  // Points: sum selected subtasks, or chore base points
  const earnedPoints = hasSubtasks
    ? subtasks.filter(s => selectedSubtasks.includes(s.name)).reduce((sum, s) => sum + s.points, 0)
    : chore?.points ?? 0;

  const canConfirm = isPasto ? !!selectedVariant : (!hasSubtasks || selectedSubtasks.length > 0);

  useEffect(() => {
    if (isOpen && chore && currentUser) {
      setSuccess(false);
      setShowDuplicateWarning(false);
      setShowCustomTime(false);
      setCustomDateOffset(0);
      setCustomTime('');
      setSelectedVariant(null);
      setSelectedSubtasks([]);
      setCoMembers([]);
      setShowCoOp(false);
      checkDuplicate();
      fetchMembers();
    }
  }, [isOpen, chore?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => { onClose(); }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const fetchMembers = async () => {
    if (!currentUser?.home_id) return;
    const { data } = await supabase.from('members').select('*').eq('home_id', currentUser.home_id);
    if (data) setMembers((data as Member[]).filter(m => m.id !== currentUser.id));
  };

  const checkDuplicate = async () => {
    if (!chore || !currentUser) return;
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data } = await supabase
      .from('logs').select('id')
      .eq('member_id', currentUser.id)
      .eq('chore_id', chore.id)
      .gte('done_at', oneHourAgo)
      .limit(1);
    if (data && data.length > 0) setShowDuplicateWarning(true);
  };

  const handleShowCustomTime = () => {
    setShowCustomTime(true);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setCustomTime(`${hh}:${mm}`);
  };

  const toggleSubtask = (name: string) => {
    setSelectedSubtasks(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const toggleCoMember = (id: string) => {
    setCoMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleConfirm = async () => {
    if (!chore || !currentUser) return;
    if (!currentUser.home_id) {
      alert('Error de sesión: No se encontró el identificador del hogar. Por favor, vuelve a seleccionar tu usuario.');
      window.dispatchEvent(new CustomEvent('open-user-modal'));
      return;
    }

    let doneAt = new Date().toISOString();
    if (showCustomTime && customTime) {
      const [hours, minutes] = customTime.split(':').map(Number);
      const date = new Date();
      date.setDate(date.getDate() - customDateOffset);
      date.setHours(hours, minutes, 0, 0);
      doneAt = date.toISOString();
    }

    setIsSubmitting(true);

    try {
      // Build metadata
      const metadata: any = {};
      if (selectedVariant) metadata.variant = selectedVariant;
      if (hasSubtasks && selectedSubtasks.length > 0) {
        metadata.subtasks = subtasks.filter(s => selectedSubtasks.includes(s.name));
        metadata.points_earned = earnedPoints;
      }
      if (coMembers.length > 0) metadata.co_member_ids = coMembers;

      // Log for self
      await choreService.completeChore(chore.id, currentUser.id, currentUser.home_id, doneAt, metadata);

      // Log for co-members with ×1.25 bonus
      if (coMembers.length > 0) {
        const coPoints = Math.round(earnedPoints * 1.25);
        const coMeta = { ...metadata, points_earned: coPoints, co_with: currentUser.id };
        for (const memberId of coMembers) {
          await choreService.completeChore(chore.id, memberId, currentUser.home_id, doneAt, coMeta);
        }
      }

      achievementService.evaluateAndUnlock(currentUser.id, currentUser.home_id).then(newlyUnlocked => {
        if (newlyUnlocked.length > 0) {
          window.dispatchEvent(new CustomEvent('achievements-unlocked', { detail: newlyUnlocked }));
        }
      }).catch(console.error);

      setSuccess(true);

      triggerPushNotification({
        title: '¡Nueva Tarea Completada! 🎉',
        body: `${currentUser.name} ha completado: ${chore.name} ${chore.emoji}`,
        sourceMemberId: currentUser.id,
        eventType: 'chore'
      });

      window.dispatchEvent(new CustomEvent('chore-logged'));
    } catch (err: any) {
      console.error('Error logging chore:', err);
      alert('Error al guardar la tarea: ' + (err.message || 'Desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !chore) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm sketchy-border-alt overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors max-h-[90vh] overflow-y-auto">

        {success ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4 animate-in zoom-in" />
            <h2 className="text-xl font-bold text-[#1E1E1E] dark:text-white">¡Guardado!</h2>
            <p className="text-[#1E1E1E]/70 dark:text-white/70 mt-2">Buen trabajo, {currentUser?.name}</p>
            {earnedPoints > 0 && (
              <p className="text-amber-500 font-black text-2xl mt-2">+{earnedPoints} pts ⭐</p>
            )}
          </div>
        ) : (
          <div className="p-6">
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="text-5xl sketchy-border-alt w-20 h-20 flex items-center justify-center">
                {chore.emoji}
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1E1E1E] dark:text-white">{chore.name}</h3>
                <p className="text-sm text-[#1E1E1E]/50 dark:text-white/50">
                  {hasSubtasks ? 'Selecciona qué completaste' : '¿Confirmas que terminaste esta tarea?'}
                </p>
                {earnedPoints > 0 && (
                  <p className="text-sm font-black text-amber-500 mt-1">+{earnedPoints} pts</p>
                )}
              </div>
            </div>

            {/* Duplicate warning */}
            {showDuplicateWarning && (
              <div className="mt-4 flex items-start gap-3 p-3 highlighter-yellow sketchy-border-alt">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Ya registraste esta tarea hace menos de una hora.
                </p>
              </div>
            )}

            {/* Subtasks checkboxes */}
            {hasSubtasks && (
              <div className="mt-5 space-y-2 animate-in slide-in-from-bottom-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#1E1E1E]/40 dark:text-white/40">¿Qué hiciste?</span>
                <div className="space-y-1.5">
                  {subtasks.map(sub => {
                    const checked = selectedSubtasks.includes(sub.name);
                    return (
                      <button
                        key={sub.name}
                        onClick={() => toggleSubtask(sub.name)}
                        className={`w-full flex items-center justify-between p-3 sketchy-border transition-all text-left ${
                          checked
                            ? 'highlighter-yellow'
                            : ''
                        }`}
                      >
                        <span className={`text-sm font-medium ${checked ? 'text-[#3584E4] dark:text-[#5B9DF5]' : 'text-[#1E1E1E] dark:text-white'}`}>
                          {sub.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black text-amber-500">+{sub.points} pts</span>
                          <div className={`w-5 h-5 sketchy-border flex items-center justify-center transition-all ${
                            checked ? 'highlighter-green' : ''
                          }`}>
                            {checked && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cortar pasto variant (existing) */}
            {isPasto && (
              <div className="mt-4 flex flex-col gap-2 animate-in slide-in-from-bottom-2">
                <span className="text-sm font-bold text-[#1E1E1E] dark:text-white mb-1">¿Qué cortaste?</span>
                <div className="grid grid-cols-3 gap-2">
                  {['Casa 3294', 'Casa 3290', 'Ambas'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedVariant(opt)}
                      className={`py-2 px-1 text-xs font-bold sketchy-border transition-all ${selectedVariant === opt ? 'highlighter-yellow scale-105' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Co-op section */}
            <div className="mt-5 border-t border-[#E5E6E6] dark:border-[#2C2C30] pt-4">
              <button
                onClick={() => setShowCoOp(v => !v)}
                className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E]/50 dark:text-white/40 hover:text-[#3584E4] dark:hover:text-[#5B9DF5] transition-colors"
              >
                <Users className="w-4 h-4" />
                ¿Lo hicieron juntos?
                {coMembers.length > 0 && (
                  <span className="text-[#3584E4] font-black ml-1">({coMembers.length}) · +25% pts para ellos</span>
                )}
              </button>
              {showCoOp && members.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 animate-in slide-in-from-top-1 duration-150">
                  {members.map(m => {
                    const selected = coMembers.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggleCoMember(m.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 sketchy-border text-xs font-bold transition-all ${
                          selected
                            ? 'highlighter-yellow text-[#1E1E1E]'
                            : 'text-[#1E1E1E] dark:text-white'
                        }`}
                      >
                        <Avatar member={m} className="w-5 h-5" />
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Buttons */}
            {!showCustomTime ? (
              <>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    onClick={onClose}
                    className="px-4 py-3 sketchy-border font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting || !canConfirm}
                    className="px-4 py-3 sketchy-border highlighter-green text-[#1E1E1E] font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : showDuplicateWarning ? 'Registrar de nuevo' : 'Sí, lo hice'}
                  </button>
                </div>
                <button
                  onClick={handleShowCustomTime}
                  className="w-full mt-3 px-4 py-3 sketchy-border text-[#1E1E1E] font-bold transition-all"
                >
                  Lo hice en otro momento
                </button>
              </>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 sketchy-border-alt">
                  {[
                    { label: 'Hoy', offset: 0 },
                    { label: 'Ayer', offset: 1 },
                    { label: '-2 días', offset: 2 },
                    { label: '-3 días', offset: 3 },
                  ].map((d) => (
                    <button
                      key={d.offset}
                      onClick={() => setCustomDateOffset(d.offset)}
                      className={`flex-1 py-2 text-xs sm:text-sm font-bold sketchy-border transition-all ${
                        customDateOffset === d.offset
                          ? 'highlighter-yellow text-[#1E1E1E]'
                          : 'text-[#1E1E1E]/50 hover:text-[#1E1E1E]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between p-3 sketchy-border-alt">
                  <span className="text-sm font-medium text-[#1E1E1E] dark:text-white">Hora</span>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="bg-transparent font-bold text-[#1E1E1E] dark:text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => setShowCustomTime(false)}
                    className="px-4 py-3 sketchy-border font-bold transition-all"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting || !customTime || !canConfirm}
                    className="px-4 py-3 sketchy-border highlighter-green text-[#1E1E1E] font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
