'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Chore } from '@/lib/types';
import { useUserStore } from '@/lib/store';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { triggerPushNotification } from '@/lib/pushUtils';
import { choreService } from '@/lib/services/choreService';

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

  useEffect(() => {
    if (isOpen && chore && currentUser) {
      setSuccess(false);
      setShowDuplicateWarning(false);
      checkDuplicate();
    }
  }, [isOpen, chore?.id]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const checkDuplicate = async () => {
    if (!chore || !currentUser) return;
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    const { data } = await supabase
      .from('logs')
      .select('id')
      .eq('member_id', currentUser.id)
      .eq('chore_id', chore.id)
      .gte('done_at', oneHourAgo)
      .limit(1);
      
    if (data && data.length > 0) {
      setShowDuplicateWarning(true);
    }
  };

  const handleConfirm = async () => {
    if (!chore || !currentUser) return;
    
    if (!currentUser.home_id) {
      alert('Error de sesión: No se encontró el identificador del hogar. Por favor, vuelve a seleccionar tu usuario.');
      window.dispatchEvent(new CustomEvent('open-user-modal'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      await choreService.completeChore(chore.id, currentUser.id, currentUser.home_id);
      setSuccess(true);

      triggerPushNotification({
        title: '¡Nueva Tarea Completada! 🎉',
        body: `${currentUser.name} ha completado: ${chore.name} ${chore.emoji}`,
        sourceMemberId: currentUser.id,
        eventType: 'chore'
      });

      // Dispatch event for other components to refresh
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
      <div className="w-full max-w-sm bg-white dark:bg-[#303030] rounded-xl shadow-lg border border-[#E5E6E6] dark:border-[#3D3D3D] overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        
        {success ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4 animate-in zoom-in" />
            <h2 className="text-xl font-bold text-[#1E1E1E] dark:text-white">¡Guardado!</h2>
            <p className="text-[#1E1E1E]/70 dark:text-white/70 mt-2">Buen trabajo, {currentUser?.name}</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="text-5xl bg-[#FAFAFA] dark:bg-[#2A2A2A] w-20 h-20 rounded-2xl flex items-center justify-center border border-[#E5E6E6] dark:border-[#3D3D3D]">
                {chore.emoji}
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1E1E1E] dark:text-white">{chore.name}</h3>
                <p className="text-sm text-[#1E1E1E]/50 dark:text-white/50">¿Confirmas que terminaste esta tarea?</p>
              </div>
            </div>

            {showDuplicateWarning && (
              <div className="mt-6 flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Ya registraste esta tarea hace menos de una hora.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                onClick={onClose}
                className="px-4 py-3 bg-[#E5E6E6] dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white font-bold rounded-xl hover:bg-[#D4D4D4] dark:hover:bg-[#474747] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="px-4 py-3 bg-[#3584E4] hover:bg-[#1C71D8] text-white font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : showDuplicateWarning ? 'Registrar de nuevo' : 'Sí, lo hice'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
