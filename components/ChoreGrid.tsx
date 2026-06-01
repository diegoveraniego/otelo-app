'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { choreService } from '@/lib/services/choreService';
import { Chore } from '@/lib/types';
import ConfirmChoreModal from './ConfirmChoreModal';
import { useUserStore } from '@/lib/store';
import { Clock, CheckCircle2 } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { offlineQueue } from '@/lib/offlineQueue';
import { triggerPushNotification } from '@/lib/pushUtils';
import { achievementService } from '@/lib/services/achievementService';

export default function ChoreGrid() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [lastDoneMap, setLastDoneMap] = useState<Map<string, string>>(new Map());
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successAnimationId, setSuccessAnimationId] = useState<string | null>(null);
  
  const { currentUser } = useUserStore();
  const timerRef = useRef<any>(null);
  const isLongPressRef = useRef(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const homeId = currentUser?.home_id;
      const [choresData, latestLogs] = await Promise.all([
        choreService.getChores(homeId),
        choreService.getLatestLogs(homeId)
      ]);
      setChores(choresData);
      setLastDoneMap(latestLogs);
    } catch (err) {
      console.error('Error fetching chores:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.home_id]);

  useEffect(() => {
    fetchData();
    
    const handleRefresh = () => fetchData();
    window.addEventListener('chore-logged', handleRefresh);
    return () => window.removeEventListener('chore-logged', handleRefresh);
  }, [fetchData]);

  // Quick log execution (double-click or long-press)
  const executeQuickLog = async (chore: Chore) => {
    if (!currentUser) {
      window.dispatchEvent(new CustomEvent('open-user-modal'));
      return;
    }
    if (!currentUser.home_id) return;

    const doneAt = new Date().toISOString();
    
    // Set success animation
    setSuccessAnimationId(chore.id);
    setTimeout(() => setSuccessAnimationId(null), 1500);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // Offline mode
      offlineQueue.enqueue(chore.id, currentUser.id, currentUser.home_id, doneAt);
      alert(`¡Guardado offline! Se sincronizará "${chore.name}" cuando recuperes conexión. 📡`);
      window.dispatchEvent(new CustomEvent('chore-logged'));
    } else {
      // Online mode
      try {
        await choreService.completeChore(chore.id, currentUser.id, currentUser.home_id, doneAt);
        
        // Evaluate achievements
        achievementService.evaluateAndUnlock(currentUser.id, currentUser.home_id).then(newlyUnlocked => {
          if (newlyUnlocked.length > 0) {
            window.dispatchEvent(new CustomEvent('achievements-unlocked', { detail: newlyUnlocked }));
          }
        }).catch(console.error);

        // Notify other family members
        triggerPushNotification({
          title: '¡Nueva Tarea Completada! 🎉',
          body: `${currentUser.name} ha completado: ${chore.name} ${chore.emoji}`,
          sourceMemberId: currentUser.id,
          eventType: 'chore'
        });

        window.dispatchEvent(new CustomEvent('chore-logged'));
      } catch (err: any) {
        console.error('Error in quick log:', err);
      }
    }
  };

  const startLongPress = (chore: Chore) => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      executeQuickLog(chore);
    }, 600); // 600ms hold
  };

  const cancelLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleChoreClick = (chore: Chore) => {
    // If it was triggered by a long press, ignore standard click
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    if (!currentUser) {
      window.dispatchEvent(new CustomEvent('open-user-modal'));
      return;
    }
    setSelectedChore(chore);
  };

  // Performance: Memoize categories
  const categories = useMemo(() => 
    Array.from(new Set(chores.map(c => c.category || 'Otros'))),
    [chores]
  );

  if (isLoading && chores.length === 0) {
    return (
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-[#E5E6E6] dark:bg-[#3D3D3D] animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }
  
  return (
    <div className="mt-8 space-y-8">
      {categories.map(category => (
        <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-sm font-semibold text-[#1E1E1E]/50 dark:text-white/50 mb-3 px-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3584E4]" />
            {category}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {chores
              .filter(c => (c.category || 'Otros') === category)
              .map((chore) => {
                const lastDone = lastDoneMap.get(chore.id);
                const daysSince = lastDone ? differenceInDays(new Date(), new Date(lastDone)) : 999;
                const isOverdue = daysSince >= (chore.threshold_days || 3);

                return (
                  <button
                    key={chore.id}
                    onClick={() => handleChoreClick(chore)}
                    onDoubleClick={() => executeQuickLog(chore)}
                    onMouseDown={() => startLongPress(chore)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onTouchStart={() => startLongPress(chore)}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    className="group relative flex flex-col items-center justify-center p-3 sm:p-4 bg-white dark:bg-[#303030] rounded-xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] hover:bg-[#FAFAFA] dark:hover:bg-[#3D3D3D] transition-all hover:scale-[1.02] active:scale-95 aspect-square w-full min-w-0 overflow-hidden"
                  >
                    {/* Success animation overlay */}
                    {successAnimationId === chore.id && (
                      <div className="absolute inset-0 bg-[#26A269]/95 dark:bg-[#1E8254]/95 rounded-xl flex flex-col items-center justify-center text-white z-10 animate-in fade-in duration-200">
                        <CheckCircle2 className="w-8 h-8 animate-bounce" />
                        <span className="text-[10px] font-bold mt-1">¡Listo!</span>
                      </div>
                    )}

                    {isOverdue && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold animate-pulse">
                        <Clock className="w-3 h-3" />
                        <span>Pte.</span>
                      </div>
                    )}
                    {(chore.points && chore.points > 1) ? (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-[#3584E4]/10 text-[#3584E4] rounded-full text-[10px] font-bold">
                        <span>⭐ {chore.points}</span>
                      </div>
                    ) : null}
                    <span className="text-3xl sm:text-4xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">{chore.emoji}</span>
                    <span className={`font-medium text-center leading-tight w-full line-clamp-2 px-1 transition-all ${
                      chore.name.length > 16 
                        ? 'text-[10px] sm:text-xs' 
                        : 'text-xs sm:text-sm'
                    } text-[#1E1E1E] dark:text-white`}>
                      {chore.name}
                    </span>
                    {lastDone && (
                      <span className="text-[10px] text-[#1E1E1E]/40 dark:text-white/40 mt-1">
                        hace {daysSince === 0 ? 'hoy' : `${daysSince} ${daysSince === 1 ? 'día' : 'días'}`}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      <ConfirmChoreModal 
        chore={selectedChore} 
        isOpen={!!selectedChore} 
        onClose={() => setSelectedChore(null)} 
      />
    </div>
  );
}
