'use client';

import { useEffect, useState, useCallback } from 'react';
import { choreService } from '@/lib/services/choreService';
import { achievementService } from '@/lib/services/achievementService';
import { LogWithDetails } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUserStore } from '@/lib/store';
import { Trash2, Smile, Heart } from 'lucide-react';
import Avatar from './Avatar';
import { triggerPushNotification } from '@/lib/pushUtils';

export default function RecentActivity() {
  const PAGE_SIZE = 15;
  const [logs, setLogs] = useState<LogWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activePickerLogId, setActivePickerLogId] = useState<string | null>(null);
  const { currentUser } = useUserStore();

  const fetchLogs = useCallback(async (reset = false) => {
    if (!currentUser?.home_id) return;
    setIsLoading(true);
    try {
      const data = await choreService.getRecentLogs(currentUser.home_id, PAGE_SIZE);
      setLogs(data);
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

  const handleToggleReaction = async (log: LogWithDetails, reactionType: string) => {
    if (!currentUser) return;

    try {
      const res = await choreService.toggleReaction(
        log.id,
        currentUser.id,
        log.member_id,
        currentUser.home_id,
        reactionType
      );

      if (res.action === 'added') {
        const emojiMap: Record<string, string> = {
          heart: '❤️',
          sparkle: '🧼',
          cook: '🍳',
          paw: '🐾',
          speed: '⚡',
        };
        const emoji = emojiMap[reactionType] || '❤️';
        triggerPushNotification({
          title: '¡Reaccionaron a tu tarea! ✨',
          body: `${currentUser.name} reaccionó con ${emoji} a tu tarea: ${log.chore.name} ${log.chore.emoji}`,
          targetMemberId: log.member_id,
          eventType: 'thanks',
        });
      }

      fetchLogs(true);
      window.dispatchEvent(new CustomEvent('thanks-updated'));

      // Evaluate achievements for giving a reaction / thanks
      achievementService.evaluateAndUnlock(currentUser.id, currentUser.home_id).then(newlyUnlocked => {
        if (newlyUnlocked.length > 0) {
          window.dispatchEvent(new CustomEvent('achievements-unlocked', { detail: newlyUnlocked }));
        }
      }).catch(console.error);
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  if (!currentUser?.home_id) return null;

  if (logs.length === 0 && !isLoading) {
    return (
      <div className="mt-8 mb-4">
        <h2 className="text-lg font-bold text-[#1E1E1E] dark:text-white mb-4 px-1">
          Actividad Reciente
        </h2>
        <div className="bg-white dark:bg-[#303030] rounded-2xl p-8 text-center border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors shadow-sm">
          <div className="text-3xl mb-2">✨</div>
          <p className="text-sm font-medium text-[#1E1E1E] dark:text-white mb-1">
            Sin actividad reciente
          </p>
          <p className="text-xs text-[#1E1E1E]/50 dark:text-white/40">
            ¡Las tareas completadas por tu familia aparecerán aquí!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-4">
      <h2 className="text-lg font-bold text-[#1E1E1E] dark:text-white mb-4 px-1 flex items-center justify-between">
        Actividad Reciente
        {isLoading && <span className="w-4 h-4 rounded-full border-2 border-[#3584E4] border-t-transparent animate-spin" />}
      </h2>
      
      <div className="bg-white dark:bg-[#303030] rounded-2xl overflow-hidden shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
        <div className="flex flex-col">
          {logs.map((log, i) => {
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

                  {/* Grouped Reactions display */}
                  {log.thanks && log.thanks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 animate-in fade-in duration-200">
                      {Object.entries(
                        log.thanks.reduce((acc, t) => {
                          acc[t.reaction_type] = acc[t.reaction_type] || [];
                          acc[t.reaction_type].push(t);
                          return acc;
                        }, {} as Record<string, typeof log.thanks>)
                      ).map(([reactionType, thanksForType]) => {
                        const hasUserReacted = thanksForType.some(t => t.from_member_id === currentUser?.id);
                        const listNames = thanksForType.map(t => t.member?.name || 'Alguien').join(', ');
                        const emojiMap: Record<string, string> = {
                          heart: '❤️',
                          sparkle: '🧼',
                          cook: '🍳',
                          paw: '🐾',
                          speed: '⚡',
                        };
                        const emoji = emojiMap[reactionType] || '❤️';

                        return (
                          <button
                            key={reactionType}
                            title={listNames}
                            onClick={() => handleToggleReaction(log, reactionType)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-all border ${
                              hasUserReacted
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 scale-105 shadow-sm'
                                : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/40 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px]">{thanksForType.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 relative">
                  {canThank && (
                    <>
                      {/* Botón de Agradecimiento Rápido (Heart) */}
                      <button
                        onClick={() => handleToggleReaction(log, 'heart')}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${
                          log.thanks?.some(t => t.from_member_id === currentUser?.id && t.reaction_type === 'heart')
                            ? 'text-[#E01B24] dark:text-[#FF6B6B] bg-[#E01B24]/10 dark:bg-[#FF6B6B]/10 scale-105'
                            : 'text-[#1E1E1E]/30 dark:text-white/20 hover:text-[#E01B24] dark:hover:text-[#FF6B6B] hover:bg-[#E01B24]/10 dark:hover:bg-[#FF6B6B]/10 hover:scale-110 active:scale-95'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 transition-all ${
                            log.thanks?.some(t => t.from_member_id === currentUser?.id && t.reaction_type === 'heart')
                              ? 'scale-110 fill-current'
                              : 'none'
                          }`}
                        />
                      </button>

                      {/* Selector de Reacciones (Smile) */}
                      <div className="relative">
                        <button
                          onClick={() => setActivePickerLogId(activePickerLogId === log.id ? null : log.id)}
                          className={`p-2.5 rounded-xl transition-all duration-300 ${
                            activePickerLogId === log.id
                              ? 'text-[#3584E4] bg-[#3584E4]/10'
                              : 'text-[#1E1E1E]/30 dark:text-white/20 hover:text-[#3584E4] hover:bg-[#3584E4]/10 hover:scale-105'
                          }`}
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                        {activePickerLogId === log.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setActivePickerLogId(null)} />
                            <div className="absolute right-0 bottom-full mb-2 z-40 bg-white dark:bg-[#303030] border border-[#E5E6E6] dark:border-[#3D3D3D] rounded-2xl p-1.5 shadow-xl flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                              {[
                                { name: 'heart', emoji: '❤️', label: 'Amor' },
                                { name: 'sparkle', emoji: '🧼', label: 'Limpieza' },
                                { name: 'cook', emoji: '🍳', label: 'Sabroso' },
                                { name: 'paw', emoji: '🐾', label: 'Mascota' },
                                { name: 'speed', emoji: '⚡', label: 'Rayo' },
                              ].map((r) => {
                                const alreadyHasThis = log.thanks?.some(t => t.from_member_id === currentUser?.id && t.reaction_type === r.name);
                                return (
                                  <button
                                    key={r.name}
                                    title={r.label}
                                    onClick={() => {
                                      handleToggleReaction(log, r.name);
                                      setActivePickerLogId(null);
                                    }}
                                    className={`text-xl p-1.5 hover:scale-125 active:scale-95 rounded-lg transition-all ${
                                      alreadyHasThis ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                                    }`}
                                  >
                                    {r.emoji}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </>
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
