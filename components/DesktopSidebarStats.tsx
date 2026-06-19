'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Member } from '@/lib/types';
import { startOfWeek, endOfWeek } from 'date-fns';
import { Heart, Star } from 'lucide-react';
import Avatar from './Avatar';
import { useUserStore } from '@/lib/store';

type MemberStat = {
  member: Member;
  tasks: number;
  points: number;
  thanks: number;
};

export default function DesktopSidebarStats() {
  const { currentUser } = useUserStore();
  const [stats, setStats] = useState<MemberStat[]>([]);
  const [viewMode, setViewMode] = useState<'points' | 'tasks'>('points');

  const fetchStats = useCallback(async () => {
    if (!currentUser?.home_id) return;

    const { data: members } = await supabase
      .from('members')
      .select('*')
      .eq('home_id', currentUser.home_id);
      
    if (!members) return;

    const start = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const end = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

    const [{ data: logs }, { data: thanks }] = await Promise.all([
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

    setStats(result);
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

  const sortedStats = [...stats].sort((a, b) => {
    if (viewMode === 'points') {
      return b.points - a.points || b.tasks - a.tasks;
    }
    return b.tasks - a.tasks || b.points - a.points;
  });

  return (
    <div className="bg-white dark:bg-[#303030] rounded-xl p-4 shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60">Ranking semanal</h3>
        <div className="flex bg-[#E5E6E6] dark:bg-[#242424] p-0.5 rounded-lg text-xs font-medium">
          <button 
            onClick={() => setViewMode('points')}
            className={`px-2 py-1 rounded-md transition-colors ${viewMode === 'points' ? 'bg-white dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white shadow-sm' : 'text-[#1E1E1E]/50 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'}`}
          >
            Puntos
          </button>
          <button 
            onClick={() => setViewMode('tasks')}
            className={`px-2 py-1 rounded-md transition-colors ${viewMode === 'tasks' ? 'bg-white dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white shadow-sm' : 'text-[#1E1E1E]/50 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'}`}
          >
            Tareas
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {sortedStats.map((item, index) => {
          const maxValue = viewMode === 'points' ? Math.max(1, sortedStats[0]?.points || 1) : Math.max(1, sortedStats[0]?.tasks || 1);
          const value = viewMode === 'points' ? item.points : item.tasks;
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
                    {item.member.selected_title && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#1E1E1E]/40 dark:text-white/40 leading-none mt-0.5">
                        {item.member.selected_title}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-bold text-[#1E1E1E] dark:text-white flex items-center gap-1">
                      {viewMode === 'points' && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      {value}
                    </span>
                    {item.thanks > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-[#E01B24] dark:text-[#FF6B6B]">
                        <Heart className="w-3 h-3" fill="currentColor" />
                        {item.thanks}
                      </span>
                    )}
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
  );
}
