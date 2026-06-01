'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@/lib/store';
import { feedingService } from '@/lib/services/feedingService';
import { choreService } from '@/lib/services/choreService';
import { choreVoteService } from '@/lib/services/choreVoteService';
import { format, startOfWeek } from 'date-fns';
import Link from 'next/link';
import { Target, Bone } from 'lucide-react';

export default function HomeWarnings() {
  const { currentUser } = useUserStore();
  const [missingFeeding, setMissingFeeding] = useState(false);
  const [missingVotes, setMissingVotes] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkWarnings = useCallback(async () => {
    if (!currentUser?.home_id) return;
    try {
      // 1. Check Feeding
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const pets = await feedingService.getPets(currentUser.home_id);
      
      let hasFeedingSlot = false;
      if (pets && pets.length > 0) {
        const slots = await feedingService.getWeeklySlots(weekStart, pets[0].id);
        hasFeedingSlot = slots.some(s => s.assigned_to === currentUser.id);
      } else {
        // If no pets, no feeding missing
        hasFeedingSlot = true; 
      }
      setMissingFeeding(!hasFeedingSlot);

      // 2. Check Votes
      const [chores, votes] = await Promise.all([
        choreService.getChores(currentUser.home_id),
        choreVoteService.getVotes(currentUser.home_id)
      ]);
      const userVotes = votes.filter(v => v.member_id === currentUser.id);
      setMissingVotes(userVotes.length < chores.length);

    } catch (err) {
      console.error('Error checking warnings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    checkWarnings();
  }, [checkWarnings]);

  if (isLoading || !currentUser) return null;

  if (!missingFeeding && !missingVotes) return null;

  return (
    <div className="space-y-3 mb-6 mt-2">
      {missingFeeding && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-xl text-amber-600 dark:text-amber-400">
              <Bone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm">¡Aún no tienes turnos de Otelo!</h4>
              <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-0.5">No te has anotado para alimentar a la mascota esta semana.</p>
            </div>
          </div>
          <Link 
            href="/pets"
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors text-center shadow-sm"
          >
            Anotarse
          </Link>
        </div>
      )}

      {missingVotes && (
        <div className="bg-[#3584E4]/10 dark:bg-[#3584E4]/20 border border-[#3584E4]/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="bg-[#3584E4]/20 p-2 rounded-xl text-[#3584E4]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#3584E4] dark:text-[#6fb0ff] text-sm">Vota el valor de las tareas</h4>
              <p className="text-xs text-[#3584E4]/80 dark:text-[#6fb0ff]/80 mt-0.5">Faltan tareas por valorar para definir sus puntos.</p>
            </div>
          </div>
          <Link 
            href="/council"
            className="shrink-0 bg-[#3584E4] hover:bg-[#1C71D8] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors text-center shadow-sm"
          >
            Votar ahora
          </Link>
        </div>
      )}
    </div>
  );
}
