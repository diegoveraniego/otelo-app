'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Member } from '@/lib/types';
import { startOfWeek, endOfWeek } from 'date-fns';
import { Heart } from 'lucide-react';
import Avatar from './Avatar';
import { useUserStore } from '@/lib/store';

type MemberStat = {
  member: Member;
  tasks: number;
  thanks: number;
};

export default function DesktopSidebarStats() {
  const { currentUser } = useUserStore();
  const [stats, setStats] = useState<MemberStat[]>([]);

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
        .select('member_id')
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
      .map((m: any) => ({
        member: m as Member,
        tasks: logs?.filter((l) => l.member_id === m.id).length ?? 0,
        thanks: thanks?.filter((t) => t.to_member_id === m.id).length ?? 0,
      }))
      .sort((a, b) => b.tasks - a.tasks || b.thanks - a.thanks);

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

  return (
    <div className="bg-white dark:bg-[#303030] rounded-xl p-4 shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
      <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60 mb-4">Ranking semanal</h3>
      <div className="space-y-3">
        {stats.map((item, index) => {
          const maxTasks = stats[0]?.tasks || 1;
          const pct = maxTasks > 0 ? Math.max(4, Math.round((item.tasks / maxTasks) * 100)) : 4;

          return (
            <div key={item.member.id} className="flex items-center gap-2">
              <div className="text-xs font-bold text-[#1E1E1E]/30 dark:text-white/30 w-5 text-right shrink-0">
                #{index + 1}
              </div>
              <Avatar member={item.member} className="w-8 h-8 text-sm shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#1E1E1E] dark:text-white truncate">
                    {item.member.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-bold text-[#1E1E1E] dark:text-white">{item.tasks}</span>
                    {item.thanks > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-[#E01B24] dark:text-[#FF6B6B]">
                        <Heart className="w-3 h-3" fill="currentColor" />
                        {item.thanks}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-1.5 w-full bg-[#E5E6E6] dark:bg-[#3D3D3D] rounded-full overflow-hidden">
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
