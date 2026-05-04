'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { LogWithDetails } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUserStore } from '@/lib/store';
import { Trash2, Heart } from 'lucide-react';
import Avatar from './Avatar';

export default function RecentActivity() {
  const [logs, setLogs] = useState<LogWithDetails[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [thankingId, setThankingId] = useState<string | null>(null);
  const [myThanks, setMyThanks] = useState<string[]>([]); // log_ids already thanked by currentUser
  const { currentUser } = useUserStore();

  useEffect(() => {
    fetchLogs();

    const handleRefresh = () => fetchLogs();
    window.addEventListener('chore-logged', handleRefresh);
    window.addEventListener('thanks-updated', handleRefresh);
    return () => {
      window.removeEventListener('chore-logged', handleRefresh);
      window.removeEventListener('thanks-updated', handleRefresh);
    };
  }, [currentUser]);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('logs')
      .select('*, member:members(*), chore:chores(*)')
      .order('done_at', { ascending: false })
      .limit(15);

    if (data) {
      setLogs(data as unknown as LogWithDetails[]);

      // Fetch which logs the current user has already thanked
      if (currentUser) {
        const logIds = data.map((l) => l.id);
        const { data: thanksData } = await supabase
          .from('thanks')
          .select('log_id')
          .eq('from_member_id', currentUser.id)
          .in('log_id', logIds);

        setMyThanks(thanksData?.map((t) => t.log_id) ?? []);
      }
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm('¿Seguro que quieres deshacer esta tarea?')) return;

    setDeletingId(logId);
    const { error } = await supabase.from('logs').delete().eq('id', logId);

    if (!error) {
      fetchLogs();
      window.dispatchEvent(new CustomEvent('chore-logged'));
    }
    setDeletingId(null);
  };

  const handleThank = async (log: LogWithDetails) => {
    if (!currentUser || myThanks.includes(log.id)) return;

    // Optimistic update: marcar inmediatamente antes de esperar respuesta de DB
    setMyThanks((prev) => [...prev, log.id]);
    setThankingId(log.id);

    const { error } = await supabase.from('thanks').insert({
      log_id: log.id,
      from_member_id: currentUser.id,
      to_member_id: log.member_id,
    });

    if (!error) {
      window.dispatchEvent(new CustomEvent('thanks-updated'));
    } else {
      // Revertir si falló (ej: tabla no existe aún)
      setMyThanks((prev) => prev.filter((id) => id !== log.id));
      console.error('Error al registrar agradecimiento:', error.message);
    }
    setThankingId(null);
  };

  if (logs.length === 0) return null;

  return (
    <div className="mt-8 mb-4">
      <h2 className="text-lg font-bold text-[#1E1E1E] dark:text-white mb-4 px-1">Actividad Reciente</h2>
      <div className="bg-white dark:bg-[#303030] rounded-xl p-2 shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
        <div className="flex flex-col">
          {logs.map((log, i) => {
            const alreadyThanked = myThanks.includes(log.id);
            const isOwnLog = currentUser?.id === log.member_id;
            const canThank = currentUser && !isOwnLog;

            return (
              <div
                key={log.id}
                className={`flex items-center gap-4 p-3 ${i !== logs.length - 1 ? 'border-b border-[#E5E6E6] dark:border-[#3D3D3D]' : ''}`}
              >
                <Avatar member={log.member} className="w-10 h-10 text-base" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1E1E1E] dark:text-white truncate">
                    <span className="font-semibold">{log.member.name}</span> hizo{' '}
                    <span className="font-medium truncate inline-block max-w-[120px] sm:max-w-xs align-bottom">{log.chore.name}</span> {log.chore.emoji}
                  </p>
                  <p className="text-xs text-[#1E1E1E]/70 dark:text-white/70 mt-0.5">
                    Hace {formatDistanceToNow(new Date(log.done_at), { locale: es })}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Botón de agradecimiento */}
                  {canThank && (
                    <button
                      onClick={() => handleThank(log)}
                      disabled={thankingId === log.id || alreadyThanked}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        alreadyThanked
                          ? 'text-[#E01B24] dark:text-[#FF6B6B] bg-[#E01B24]/10 dark:bg-[#FF6B6B]/10 cursor-default'
                          : 'text-[#1E1E1E]/40 dark:text-white/40 hover:text-[#E01B24] dark:hover:text-[#FF6B6B] hover:bg-[#E01B24]/10 dark:hover:bg-[#FF6B6B]/10 hover:scale-110 active:scale-95'
                      } disabled:opacity-60`}
                      title={alreadyThanked ? '¡Ya agradeciste!' : `Agradecer a ${log.member.name}`}
                    >
                      <Heart
                        className="w-4 h-4 transition-transform"
                        fill={alreadyThanked ? 'currentColor' : 'none'}
                      />
                    </button>
                  )}

                  {/* Botón de deshacer (solo tus propias tareas) */}
                  {isOwnLog && (
                    <button
                      onClick={() => handleDelete(log.id)}
                      disabled={deletingId === log.id}
                      className="p-2 text-[#1E1E1E]/50 dark:text-white/50 hover:text-[#E01B24] dark:hover:text-[#FF7B63] hover:bg-[#E01B24]/10 dark:hover:bg-[#FF7B63]/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Deshacer tarea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
