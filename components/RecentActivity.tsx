'use client';

import { useEffect, useState, useCallback } from 'react';
import { choreService } from '@/lib/services/choreService';
import { LogWithDetails } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUserStore } from '@/lib/store';
import { Trash2, Heart } from 'lucide-react';
import Avatar from './Avatar';
import { triggerPushNotification } from '@/lib/pushUtils';

export default function RecentActivity() {
  const PAGE_SIZE = 15;
  const [logs, setLogs] = useState<LogWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [thankingId, setThankingId] = useState<string | null>(null);
  const [myThanks, setMyThanks] = useState<string[]>([]);
  const { currentUser } = useUserStore();

  const fetchLogs = useCallback(async (reset = false) => {
    setIsLoading(true);
    try {
      const data = await choreService.getRecentLogs(PAGE_SIZE);
      setLogs(data);

      if (currentUser && data.length > 0) {
        const logIds = data.map((l) => l.id);
        const thankedIds = await choreService.getMyThanks(currentUser.id, logIds);
        setMyThanks(thankedIds);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchLogs();

    const handleRefresh = () => fetchLogs(true);
    window.addEventListener('chore-logged', handleRefresh);
    window.addEventListener('thanks-updated', handleRefresh);
    return () => {
      window.removeEventListener('chore-logged', handleRefresh);
      window.removeEventListener('thanks-updated', handleRefresh);
    };
  }, [fetchLogs]);

  const handleDelete = async (logId: string) => {
    if (!confirm('¿Seguro que quieres deshacer esta tarea?')) return;

    setDeletingId(logId);
    try {
      await choreService.deleteLog(logId);
      fetchLogs(true);
      window.dispatchEvent(new CustomEvent('chore-logged'));
    } catch (err) {
      console.error('Error deleting log:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleThank = async (log: LogWithDetails) => {
    if (!currentUser || myThanks.includes(log.id)) return;

    // Optimistic UI update
    setMyThanks((prev) => [...prev, log.id]);
    setThankingId(log.id);

    try {
      await choreService.giveThanks(log.id, currentUser.id, log.member_id, currentUser.home_id);
      
      triggerPushNotification({
        title: '¡Alguien te ha agradecido! ❤️',
        body: `${currentUser.name} te dio las gracias por ${log.chore.name} ${log.chore.emoji}`,
        targetMemberId: log.member_id,
        eventType: 'thanks'
      });
      
      window.dispatchEvent(new CustomEvent('thanks-updated'));
    } catch (error: any) {
      // Rollback on error
      setMyThanks((prev) => prev.filter((id) => id !== log.id));
      console.error('Error giving thanks:', error);
      alert('No se pudo enviar el agradecimiento');
    } finally {
      setThankingId(null);
    }
  };

  if (logs.length === 0 && !isLoading) return null;

  return (
    <div className="mt-8 mb-4">
      <h2 className="text-lg font-bold text-[#1E1E1E] dark:text-white mb-4 px-1 flex items-center justify-between">
        Actividad Reciente
        {isLoading && <span className="w-4 h-4 rounded-full border-2 border-[#3584E4] border-t-transparent animate-spin" />}
      </h2>
      
      <div className="bg-white dark:bg-[#303030] rounded-2xl overflow-hidden shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
        <div className="flex flex-col">
          {logs.map((log, i) => {
            const alreadyThanked = myThanks.includes(log.id);
            const isOwnLog = currentUser?.id === log.member_id;
            const canThank = currentUser && !isOwnLog;

            return (
              <div
                key={log.id}
                className={`flex items-center gap-4 p-4 ${
                  i !== logs.length - 1 ? 'border-b border-[#E5E6E6] dark:border-[#3D3D3D]' : ''
                } hover:bg-[#FAFAFA] dark:hover:bg-[#353535] transition-colors group`}
              >
                <Avatar member={log.member} className="w-10 h-10 text-base" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1E1E1E] dark:text-white truncate">
                    <span className="font-semibold">{log.member.name}</span> hizo{' '}
                    <span className="font-medium">{log.chore.name}</span> {log.chore.emoji}
                  </p>
                  <p className="text-[11px] text-[#1E1E1E]/50 dark:text-white/40 mt-0.5">
                    Hace {formatDistanceToNow(new Date(log.done_at), { locale: es })}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {canThank && (
                    <button
                      onClick={() => handleThank(log)}
                      disabled={thankingId === log.id || alreadyThanked}
                      className={`p-2.5 rounded-xl transition-all duration-300 ${
                        alreadyThanked
                          ? 'text-[#E01B24] dark:text-[#FF6B6B] bg-[#E01B24]/10 dark:bg-[#FF6B6B]/10 cursor-default'
                          : 'text-[#1E1E1E]/30 dark:text-white/20 hover:text-[#E01B24] dark:hover:text-[#FF6B6B] hover:bg-[#E01B24]/10 dark:hover:bg-[#FF6B6B]/10 hover:scale-110 active:scale-95'
                      } disabled:opacity-60`}
                    >
                      <Heart
                        className={`w-4 h-4 transition-all ${alreadyThanked ? 'scale-110' : ''}`}
                        fill={alreadyThanked ? 'currentColor' : 'none'}
                      />
                    </button>
                  )}

                  {isOwnLog && (
                    <button
                      onClick={() => handleDelete(log.id)}
                      disabled={deletingId === log.id}
                      className="p-2.5 text-[#1E1E1E]/30 dark:text-white/20 hover:text-[#E01B24] dark:hover:text-[#FF7B63] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
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
