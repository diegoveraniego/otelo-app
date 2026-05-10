'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Chore } from '@/lib/types';
import { useUserStore } from '@/lib/store';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { subHours } from 'date-fns';
import { triggerPushNotification } from '@/lib/pushUtils';

type Props = {
  chore: Chore | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function ConfirmChoreModal({ chore, isOpen, onClose }: Props) {
  const { currentUser } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && chore && currentUser) {
      checkDuplicate();
    } else {
      setShowDuplicateWarning(false);
      setSuccess(false);
    }
  }, [isOpen, chore, currentUser]);

  const checkDuplicate = async () => {
    if (!chore || !currentUser) return;
    
    const oneHourAgo = subHours(new Date(), 1).toISOString();
    
    const { data, error } = await supabase
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
    setIsSubmitting(true);
    
    const { error } = await supabase.from('logs').insert({
      member_id: currentUser.id,
      chore_id: chore.id,
    });

    setIsSubmitting(false);
    
    if (!error) {
      setSuccess(true);
      triggerPushNotification({
        title: '¡Nueva Tarea Completada! 🎉',
        body: `${currentUser.name} ha completado: ${chore.name} ${chore.emoji}`,
        sourceMemberId: currentUser.id
      });
      setTimeout(() => {
        onClose();
        // Trigger a refresh event for recent activity/stats
        window.dispatchEvent(new CustomEvent('chore-logged'));
      }, 1500);
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
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{chore.emoji}</div>
              <h2 className="text-2xl font-bold text-[#1E1E1E] dark:text-white">¿Hiciste esto?</h2>
              <p className="text-[#1E1E1E]/70 dark:text-white/70 mt-1 text-lg">{chore.name}</p>
            </div>

            {showDuplicateWarning && (
              <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 text-orange-800 dark:text-orange-200 p-4 rounded-xl flex gap-3 mb-6 items-start">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-orange-500 dark:text-orange-400" />
                <p className="text-sm font-medium">
                  Ya registraste esta tarea hace menos de una hora. ¿Es un nuevo registro? Puedes anotarla otra vez sin problema.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 text-[#1E1E1E] dark:text-white font-medium bg-[#E5E6E6] dark:bg-[#3D3D3D] hover:bg-[#D4D4D4] dark:hover:bg-[#474747] rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 text-white font-medium bg-[#3584E4] hover:bg-[#1C71D8] rounded-lg transition-colors shadow-sm disabled:opacity-50"
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
