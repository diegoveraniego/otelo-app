'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { choreService } from '@/lib/services/choreService';
import { Chore } from '@/lib/types';
import ConfirmChoreModal from './ConfirmChoreModal';
import { useUserStore } from '@/lib/store';
import { Clock } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function ChoreGrid() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [lastDoneMap, setLastDoneMap] = useState<Map<string, string>>(new Map());
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useUserStore();

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

  const handleChoreClick = (chore: Chore) => {
    if (!currentUser) {
      window.dispatchEvent(new CustomEvent('open-user-modal'));
      return;
    }
    setSelectedChore(chore);
  };

  // Performance: Memoize categories and grouped chores
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
                    className="group relative flex flex-col items-center justify-center p-3 sm:p-4 bg-white dark:bg-[#303030] rounded-xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] hover:bg-[#FAFAFA] dark:hover:bg-[#3D3D3D] transition-all hover:scale-[1.02] active:scale-95 aspect-square w-full min-w-0"
                  >
                    {isOverdue && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold animate-pulse">
                        <Clock className="w-3 h-3" />
                        <span>Pte.</span>
                      </div>
                    )}
                    <span className="text-3xl sm:text-4xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">{chore.emoji}</span>
                    <span className="text-xs sm:text-sm font-medium text-[#1E1E1E] dark:text-white text-center leading-tight w-full truncate px-1">
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
