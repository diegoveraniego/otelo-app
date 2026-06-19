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
    <div className="bg-[#3584E4] dark:bg-[#303030] rounded-xl p-6 text-white shadow-md mb-8 overflow-hidden relative border border-[#1C71D8] dark:border-[#3D3D3D] transition-colors">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-2xl" />

      <div className="relative z-10">
        <h2 className="text-white/80 font-medium mb-1">Esta semana</h2>
        <div className="flex items-end gap-4 mb-2 flex-wrap">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold tracking-tight">{userPoints}</span>
            <span className="text-white/80 pb-1.5 flex items-center gap-1">
              <Star className="w-4 h-4 fill-current opacity-80" /> {pluralize(userPoints, 'punto', 'puntos')}
            </span>
          </div>
          <div className="flex items-end gap-2 mb-1 border-l border-white/20 pl-4">
            <span className="text-2xl font-bold tracking-tight">{userCount}</span>
            <span className="text-white/80 pb-0.5 text-sm">{pluralize(userCount, 'tarea', 'tareas')}</span>
          </div>
        </div>

        {streak >= 2 ? (
          <div className="flex items-center gap-1.5 mb-4 mt-2">
            <Flame className="w-4 h-4 text-orange-300" />
            <span className="text-sm text-white/90 font-medium">
              {streak} {pluralize(streak, 'día seguido', 'días seguidos')} aportando
            </span>
          </div>
        ) : (
          <div className="mb-4 mt-2" />
        )}

        <div className="bg-black/10 dark:bg-black/20 rounded-lg p-4 backdrop-blur-sm border border-white/10">
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-300">Promedio familiar (tareas)</span>
            <span className="font-semibold text-white">
              {familyAvg} {pluralize(familyAvg, 'tarea', 'tareas')}
            </span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, (userCount / Math.max(1, familyAvg * 2)) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
