'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { LogWithDetails } from '@/lib/types';
import { X, Flag, AlertTriangle } from 'lucide-react';

interface DisputeModalProps {
  log: LogWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DisputeModal({ log, onClose, onSuccess }: DisputeModalProps) {
  const { currentUser } = useUserStore();
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !reason.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create the dispute
      const { error: disputeError } = await supabase
        .from('disputes')
        .insert({
          log_id: log.id,
          home_id: currentUser.home_id,
          disputed_by: currentUser.id,
          reason: reason.trim(),
          status: 'pending',
          votes: {}
        });

      if (disputeError) throw disputeError;

      // Update the log
      const { error: logError } = await supabase
        .from('logs')
        .update({ has_dispute: true })
        .eq('id', log.id);

      if (logError) throw logError;

      onSuccess();
    } catch (err: any) {
      console.error('Error creating dispute:', err);
      setError(err.message || 'No se pudo crear la disputa.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1A1A1E] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E5E6E6] dark:border-[#2C2C30] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-[#E5E6E6] dark:border-[#2C2C30]">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500">
              <Flag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E1E1E] dark:text-white">
                Disputar Tarea
              </h2>
              <p className="text-xs text-[#1E1E1E]/60 dark:text-white/60">
                {log.member.name} - {log.chore.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#2C2C30] rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#1E1E1E] dark:text-white mb-2">
              ¿Por qué disputas esta tarea?
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: No limpió bien el piso, olvidó sacar la basura..."
              className="w-full bg-[#FAFAFA] dark:bg-[#252525] border border-[#E5E6E6] dark:border-[#404040] rounded-xl p-3 text-sm text-[#1E1E1E] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all min-h-[100px] resize-none"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#2C2C30] dark:hover:bg-[#353535] text-[#1E1E1E] dark:text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !reason.trim()}
              className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              {isLoading ? 'Enviando...' : 'Abrir Disputa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
