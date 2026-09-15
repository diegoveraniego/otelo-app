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
  basePoints: number;
  streakMultiplier: number;
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
        .select('member_id, done_at, metadata, chores(points)')
        .eq('home_id', currentUser.home_id)
        .gte('done_at', start)
        .lte('done_at', end),
      supabase.from('thanks')
        .select('to_member_id')
        .eq('home_id', currentUser.home_id)
        .gte('created_at', start)
        .lte('created_at', end),
      supabase.from('logs')
        .select('member_id, metadata, chores(points)')
        .eq('home_id', currentUser.home_id)
    ]);

    const getStreakMultiplier = (distinctDays: number) => {
      if (distinctDays >= 6) return 1.30;
      if (distinctDays >= 4) return 1.20;
      if (distinctDays >= 2) return 1.10;
      return 1.0;
    };

    const result: MemberStat[] = (members as any[])
      .map((m: any) => {
        const memberLogs = logs?.filter((l) => l.member_id === m.id) || [];
        const basePoints = memberLogs.reduce((acc, l: any) => {
          const earned = (l.metadata as any)?.points_earned;
          return acc + (earned != null ? earned : (l.chores?.points || 0));
        }, 0);
        const distinctDays = new Set(
          memberLogs.map((l: any) => new Date(l.done_at).toDateString())
        ).size;
        const multiplier = getStreakMultiplier(distinctDays);
        return {
          member: m as Member,
          tasks: memberLogs.length,
          basePoints,
          points: Math.round(basePoints * multiplier),
          streakMultiplier: multiplier,
          thanks: thanks?.filter((t) => t.to_member_id === m.id).length ?? 0,
        };
      });

    const histResult: MemberStat[] = (members as any[])
      .map((m: any) => {
        const mLogs = allLogs?.filter((l) => l.member_id === m.id) || [];
        const pts = mLogs.reduce((acc, l: any) => {
          const earned = (l.metadata as any)?.points_earned;
          return acc + (earned != null ? earned : (l.chores?.points || 0));
        }, 0);
        return {
          member: m as Member,
          tasks: mLogs.length,
          basePoints: pts,
          points: pts,
          streakMultiplier: 1.0,
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
      <div className="sketchy-border-alt p-4 transition-colors">
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
                        {value} <span className="text-xs font-bold text-[#1E1E1E]/50 dark:text-white/50">pts</span>
                      </span>
                      {item.streakMultiplier > 1.0 && (
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                          ⚡×{item.streakMultiplier.toFixed(2).replace('.00', '')}
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-[#1E1E1E]/30 dark:text-white/30">
                        {item.tasks} {item.tasks === 1 ? 'tarea' : 'tareas'}
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
      <div className="sketchy-border-alt p-4 transition-colors">
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
