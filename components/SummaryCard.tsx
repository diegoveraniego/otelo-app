'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { startOfWeek, endOfWeek, subDays, format } from 'date-fns';
import { Flame, Star } from 'lucide-react';

function pluralize(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural;
}

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

export default function SummaryCard() {
  const { currentUser } = useUserStore();
  const [userCount, setUserCount] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [familyAvg, setFamilyAvg] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    fetchStats();
    const handleRefresh = () => fetchStats();
    window.addEventListener('chore-logged', handleRefresh);
    return () => window.removeEventListener('chore-logged', handleRefresh);
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = async () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const end = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

    const { data: logs } = await supabase
      .from('logs')
      .select('member_id, chores(points)')
      .gte('done_at', start)
      .lte('done_at', end);

    if (logs) {
      const { data: members } = await supabase.from('members').select('id');
      const memberCount = members?.length || 1;
      setFamilyAvg(Math.round(logs.length / memberCount));

      if (currentUser) {
        const userLogs = logs.filter((l) => l.member_id === currentUser.id);
        setUserCount(userLogs.length);
        const points = userLogs.reduce((acc, l: any) => acc + (l.chores?.points || 0), 0);
        setUserPoints(points);
      }
    }

    if (currentUser) {
      const since = subDays(new Date(), 60).toISOString();
      const { data: streakLogs } = await supabase
        .from('logs')
        .select('done_at')
        .eq('member_id', currentUser.id)
        .gte('done_at', since);
      setStreak(calcStreak(streakLogs?.map((l) => l.done_at) ?? []));
    }
  };

  if (!currentUser) return null;

  return (
    <div className="bg-white dark:bg-[#1A1A1E] rounded-xl p-6 text-[#1E1E1E] dark:text-white shadow-sm mb-8 overflow-hidden relative border border-[#E5E6E6] dark:border-[#2C2C30] transition-colors">
      <div className="relative z-10">
        <h2 className="text-[#1E1E1E]/60 dark:text-white/60 font-medium mb-1">Esta semana</h2>
        <div className="flex items-end gap-4 mb-2 flex-wrap">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold tracking-tight text-[#3584E4]">{userPoints}</span>
            <span className="text-[#1E1E1E]/60 dark:text-white/60 pb-1.5 flex items-center gap-1">
              <Star className="w-4 h-4 fill-current opacity-80" /> {pluralize(userPoints, 'punto', 'puntos')}
            </span>
          </div>
          <div className="flex items-end gap-2 mb-1 border-l border-[#E5E6E6] dark:border-[#2C2C30] pl-4">
            <span className="text-2xl font-bold tracking-tight">{userCount}</span>
            <span className="text-[#1E1E1E]/60 dark:text-white/60 pb-0.5 text-sm">{pluralize(userCount, 'tarea', 'tareas')}</span>
          </div>
        </div>

        {streak >= 2 ? (
          <div className="flex items-center gap-1.5 mb-4 mt-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-[#1E1E1E] dark:text-white font-medium">
              {streak} {pluralize(streak, 'día seguido', 'días seguidos')} aportando
            </span>
          </div>
        ) : (
          <div className="mb-4 mt-2" />
        )}

        <div className="bg-[#FAFAFA] dark:bg-[#151518] rounded-lg p-4 border border-[#E5E6E6] dark:border-[#2C2C30]">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#1E1E1E]/60 dark:text-white/60">Promedio familiar</span>
            <span className="font-semibold text-[#1E1E1E] dark:text-white">
              {familyAvg} {pluralize(familyAvg, 'tarea', 'tareas')}
            </span>
          </div>
          <div className="h-2 w-full bg-[#E5E6E6] dark:bg-[#3D3D3D] rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-[#3584E4] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, (userCount / Math.max(1, familyAvg * 2)) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
