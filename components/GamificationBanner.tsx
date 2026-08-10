'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { startOfWeek, endOfWeek, subDays, format } from 'date-fns';
import { Flame, Trophy, Sparkles, Star, Zap } from 'lucide-react';

type Tier = {
  name: string;
  minTasks: number;
  maxTasks: number;
  mascot: string;
  title: string;
  description: string;
  progressBarColor: string;
};

const TIERS: Tier[] = [
  {
    name: 'Semilla',
    minTasks: 0,
    maxTasks: 1,
    mascot: '🐶💤',
    title: '¡Otelo te espera! 🐾',
    description: 'Haz tu primera tarea de la semana para despertar a Otelo y comenzar tu racha.',
    progressBarColor: 'bg-[#1E1E1E] dark:bg-white'
  },
  {
    name: 'Bronce',
    minTasks: 1,
    maxTasks: 4,
    mascot: '🐶👋',
    title: '¡Buen comienzo! 🚀',
    description: 'Llevas {count} tareas completadas. ¡Otelo está feliz de ver tu aporte!',
    progressBarColor: 'bg-[#3584E4]'
  },
  {
    name: 'Plata',
    minTasks: 4,
    maxTasks: 8,
    mascot: '🐶✨',
    title: '¡Excelente ritmo! 🌟',
    description: '¡Con {count} tareas completadas esta semana, eres un pilar del hogar!',
    progressBarColor: 'bg-[#3584E4]'
  },
  {
    name: 'Oro',
    minTasks: 8,
    maxTasks: 13,
    mascot: '🐶🔥',
    title: '¡Estás imparable! 💪',
    description: '¡{count} tareas completadas! Eres una máquina de productividad para toda la familia.',
    progressBarColor: 'bg-[#E01B24]'
  },
  {
    name: 'Leyenda',
    minTasks: 13,
    maxTasks: 20,
    mascot: '🐶👑',
    title: '¡Nivel Leyenda! 👑',
    description: '¡{count} tareas completadas! Has alcanzado la gloria máxima semanal. ¡Otelo te corona! 🐕❤️',
    progressBarColor: 'bg-[#E01B24]'
  }
];

function calcStreak(doneDates: string[]): number {
  if (doneDates.length === 0) return 0;
  const uniqueDays = new Set(doneDates.map((d) => d.slice(0, 10)));
  let streak = 0;
  let cursor = new Date();
  if (!uniqueDays.has(format(cursor, 'yyyy-MM-dd'))) {
    cursor = subDays(cursor, 1);
  }
  while (uniqueDays.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export default function GamificationBanner() {
  const { currentUser } = useUserStore();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [mounted, setMounted] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!currentUser?.id || !currentUser?.home_id) return;

    const start = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const end = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

    const { data: logs } = await supabase
      .from('logs')
      .select('id')
      .eq('member_id', currentUser.id)
      .gte('done_at', start)
      .lte('done_at', end);

    setUserCount(logs?.length ?? 0);

    const since = subDays(new Date(), 60).toISOString();
    const { data: streakLogs } = await supabase
      .from('logs')
      .select('done_at')
      .eq('member_id', currentUser.id)
      .gte('done_at', since);

    setStreak(calcStreak(streakLogs?.map((l) => l.done_at) ?? []));
  }, [currentUser]);

  useEffect(() => {
    setMounted(true);
    if (currentUser?.id) {
      fetchStats();

      const handleRefresh = () => fetchStats();
      window.addEventListener('chore-logged', handleRefresh);
      window.addEventListener('thanks-updated', handleRefresh);

      return () => {
        window.removeEventListener('chore-logged', handleRefresh);
        window.removeEventListener('thanks-updated', handleRefresh);
      };
    }
  }, [currentUser, fetchStats]);

  if (!mounted || !currentUser || userCount === null) return null;

  const currentTier = [...TIERS]
    .reverse()
    .find(t => userCount >= t.minTasks) || TIERS[0];

  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1] || null;
  const isMaxTier = !nextTier;

  const currentTierProgress = userCount - currentTier.minTasks;
  const totalTierRequired = isMaxTier 
    ? 20 - currentTier.minTasks 
    : nextTier.minTasks - currentTier.minTasks;

  const pct = isMaxTier 
    ? 100 
    : Math.min(100, Math.round((currentTierProgress / totalTierRequired) * 100));

  const mascotClass = currentTier.name === 'Semilla' 
    ? 'animate-pulse' 
    : currentTier.name === 'Leyenda'
      ? 'animate-bounce duration-1000'
      : 'animate-bounce';

  return (
    <div className={`bg-white dark:bg-[#1A1A1E] rounded-xl p-5 mb-6 text-[#1E1E1E] dark:text-white shadow-sm relative overflow-hidden transition-all border border-[#E5E6E6] dark:border-[#2C2C30]`}>
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-10 pointer-events-none">
        {currentTier.name === 'Leyenda' ? (
          <Trophy className="w-32 h-32 rotate-12" />
        ) : (
          <Sparkles className="w-32 h-32 rotate-12" />
        )}
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
        {/* Left: Mascot Container */}
        <div className="relative shrink-0 flex items-center justify-center bg-[#FAFAFA] dark:bg-[#151518] w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-[#E5E6E6] dark:border-[#2C2C30]">
          <span className={`text-4xl sm:text-5xl ${mascotClass}`}>
            {currentTier.mascot}
          </span>
          <div className="absolute -bottom-1 bg-white dark:bg-[#3D3D3D] text-[10px] font-bold uppercase tracking-wider text-neutral-800 dark:text-white px-2 py-0.5 rounded-full border border-[#E5E6E6] dark:border-[#2C2C30]">
            {currentTier.name}
          </div>
        </div>

        {/* Middle: Info and Progress */}
        <div className="flex-1 w-full text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
            <h3 className="text-xl font-black tracking-tight leading-none flex items-center gap-2 justify-center sm:justify-start">
              {currentTier.title}
              {currentTier.name === 'Leyenda' && <Zap className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />}
            </h3>
          </div>
          
          <p className="text-sm font-medium mt-1 opacity-70 leading-snug max-w-xl">
            {currentTier.description.replace('{count}', String(userCount))}
          </p>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center text-xs font-bold mb-1 opacity-70">
              <span>Progreso de Nivel</span>
              <span>
                {isMaxTier 
                  ? `${userCount} tareas completadas` 
                  : `${userCount} / ${nextTier.minTasks} tareas (${nextTier.name})`}
              </span>
            </div>
            
            <div className="h-4 w-full bg-[#E5E6E6] dark:bg-[#151518] rounded-full p-0.5 border border-[#E5E6E6] dark:border-[#2C2C30]">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out relative ${currentTier.progressBarColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Streak status */}
        {streak >= 1 && (
          <div className="shrink-0 flex sm:flex-col items-center gap-2 bg-[#FAFAFA] dark:bg-[#151518] rounded-xl px-4 py-3 border border-[#E5E6E6] dark:border-[#2C2C30]">
            <div className="relative">
              <Flame className="w-8 h-8 text-amber-500 fill-amber-500" />
            </div>
            <div className="text-left sm:text-center">
              <div className="text-xl font-black leading-none">{streak}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {streak === 1 ? 'Día Activo' : 'Racha de Días'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
