'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Member } from '@/lib/types';
import { startOfWeek, endOfWeek } from 'date-fns';
import { Heart, Star, Medal } from 'lucide-react';
import Avatar from './Avatar';
import UserSkillsRadar from './UserSkillsRadar';
import { useUserStore } from '@/lib/store';
import { getLevelFromPoints } from '@/lib/levels';

type MemberStat = {
  member: Member;
  tasks: number;
  points: number;
  thanks: number;
};

export default function DesktopSidebarStats() {
  const { currentUser } = useUserStore();
  const [stats, setStats] = useState<MemberStat[]>([]);
  const [historicalStats, setHistoricalStats] = useState<MemberStat[]>([]);

  const fetchStats = useCallback(async () => {
    if (!currentUser?.home_id) return;

    const { data: members } = await supabase
      .from('members')
      .select('*')
      .eq('home_id', currentUser.home_id);
      
    if (!members) return;

    const start = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const end = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

    const [{ data: logs }, { data: thanks }, { data: allLogs }] = await Promise.all([
      supabase.from('logs')
        .select('member_id, chores(points)')
        .eq('home_id', currentUser.home_id)
        .gte('done_at', start)
        .lte('done_at', end),
      supabase.from('thanks')
        .select('to_member_id')
        .eq('home_id', currentUser.home_id)
        .gte('created_at', start)
        .lte('created_at', end),
      supabase.from('logs')
        .select('member_id, chores(points)')
        .eq('home_id', currentUser.home_id)
    ]);

    const result: MemberStat[] = (members as any[])
      .map((m: any) => {
        const memberLogs = logs?.filter((l) => l.member_id === m.id) || [];
        const points = memberLogs.reduce((acc, l: any) => acc + (l.chores?.points || 0), 0);
        return {
          member: m as Member,
          tasks: memberLogs.length,
          points,
          thanks: thanks?.filter((t) => t.to_member_id === m.id).length ?? 0,
        };
      });

    const histResult: MemberStat[] = (members as any[])
      .map((m: any) => {
        const mLogs = allLogs?.filter((l) => l.member_id === m.id) || [];
        const pts = mLogs.reduce((acc, l: any) => acc + (l.chores?.points || 0), 0);
        return {
          member: m as Member,
          tasks: mLogs.length,
          points: pts,
          thanks: 0,
        };
      });

    setStats(result);
    setHistoricalStats(histResult);
  }, [currentUser?.home_id]);

  useEffect(() => {
    if (currentUser?.home_id) {
      fetchStats();

      const handler = () => fetchStats();
      window.addEventListener('chore-logged', handler);
      window.addEventListener('thanks-updated', handler);
      return () => {
        window.removeEventListener('chore-logged', handler);
        window.removeEventListener('thanks-updated', handler);
      };
    }
  }, [fetchStats, currentUser?.home_id]);

  if (stats.length === 0) return null;

  const sortedStats = [...stats].sort((a, b) => b.points - a.points || b.tasks - a.tasks);
  const sortedHistStats = [...historicalStats].sort((a, b) => b.points - a.points);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Ranking Semanal */}
      <div className="bg-white dark:bg-[#1A1A1E] rounded-xl p-4 shadow-sm border border-[#E5E6E6] dark:border-[#2C2C30] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60">Ranking Semanal</h3>
        </div>
        <div className="space-y-3">
          {sortedStats.map((item, index) => {
            const maxValue = Math.max(1, sortedStats[0]?.points || 1);
            const value = item.points;
            const pct = maxValue > 0 ? Math.max(4, Math.round((value / maxValue) * 100)) : 4;

            return (
              <div key={item.member.id} className="flex items-center gap-2">
                <div className="text-xs font-bold text-[#1E1E1E]/30 dark:text-white/30 w-5 text-right shrink-0">
                  #{index + 1}
                </div>
                <Avatar member={item.member} className="w-8 h-8 text-sm shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-[#1E1E1E] dark:text-white truncate">
                        {item.member.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-sm font-bold text-[#1E1E1E] dark:text-white flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {value} <span className="text-xs font-normal text-[#1E1E1E]/50 dark:text-white/50">({item.tasks})</span>
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-[#E5E6E6] dark:bg-[#3D3D3D] rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: item.member.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nivel Histórico */}
      <div className="bg-white dark:bg-[#1A1A1E] rounded-xl p-4 shadow-sm border border-[#E5E6E6] dark:border-[#2C2C30] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60">Nivel Histórico</h3>
        </div>
        <div className="space-y-3">
          {sortedHistStats.map((item, index) => {
            const level = getLevelFromPoints(item.points);
            return (
              <div key={item.member.id} className="flex items-center gap-2">
                <div className="text-xs font-bold text-[#1E1E1E]/30 dark:text-white/30 w-5 text-right shrink-0">
                  #{index + 1}
                </div>
                <Avatar member={item.member} className="w-8 h-8 text-sm shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-[#1E1E1E] dark:text-white truncate">
                        {item.member.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Medal className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-sm font-bold text-[#1E1E1E] dark:text-white">
                        {item.points}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <UserSkillsRadar />
    </div>
  );
}
