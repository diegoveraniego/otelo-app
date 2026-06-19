'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Heart, Star } from 'lucide-react';
import { startOfWeek, endOfWeek } from 'date-fns';
import { Member } from '@/lib/types';
import ChartTooltip from './ChartTooltip';
import ThanksRankingCard, { ThanksRankingEntry } from './ThanksRankingCard';
import { useTheme } from 'next-themes';
import Avatar from '@/components/Avatar';
import { useUserStore } from '@/lib/store';

type StatsData = {
  name: string;
  color: string;
  total: number;
  points: number;
  thanks: number;
  avatar_url?: string | null;
};

export default function WeeklyStats() {
  const { currentUser } = useUserStore();
  const [data, setData] = useState<StatsData[]>([]);
  const [thanksRanking, setThanksRanking] = useState<ThanksRankingEntry[]>([]);
  const [viewMode, setViewMode] = useState<'points' | 'tasks'>('points');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (currentUser?.home_id) {
      fetchStats();
    }
  }, [currentUser?.home_id]);

  const fetchStats = async () => {
    if (!currentUser?.home_id) return;
    
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const end = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

    const { data: members } = await supabase
      .from('members')
      .select('*')
      .eq('home_id', currentUser.home_id);
    
    if (!members) return;

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

    if (logs) {
      const stats = (members as any[]).map((m: any) => {
        const memberLogs = logs.filter(l => l.member_id === m.id);
        const points = memberLogs.reduce((acc, l: any) => acc + (l.chores?.points || 0), 0);
        return {
          name: m.name,
          color: m.color,
          total: memberLogs.length,
          points,
          thanks: thanks?.filter(t => t.to_member_id === m.id).length ?? 0,
          avatar_url: m.avatar_url ?? null,
        };
      }).sort((a, b) => b.points - a.points);
      
      setData(stats);

      // Build thanks ranking
      setThanksRanking(
        (members as any[]).map((m: any) => ({
          member: m as Member,
          count: thanks?.filter(t => t.to_member_id === m.id).length ?? 0,
        }))
      );
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (viewMode === 'points') return b.points - a.points || b.total - a.total;
    return b.total - a.total || b.points - a.points;
  });

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-white dark:bg-[#303030] p-6 rounded-xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60">Rendimiento esta semana</h3>
          <div className="flex bg-[#E5E6E6] dark:bg-[#242424] p-0.5 rounded-lg text-xs font-medium">
            <button 
              onClick={() => setViewMode('points')}
              className={`px-3 py-1.5 rounded-md transition-colors ${viewMode === 'points' ? 'bg-white dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white shadow-sm' : 'text-[#1E1E1E]/50 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'}`}
            >
              Puntos
            </button>
            <button 
              onClick={() => setViewMode('tasks')}
              className={`px-3 py-1.5 rounded-md transition-colors ${viewMode === 'tasks' ? 'bg-white dark:bg-[#3D3D3D] text-[#1E1E1E] dark:text-white shadow-sm' : 'text-[#1E1E1E]/50 dark:text-white/50 hover:text-[#1E1E1E] dark:hover:text-white'}`}
            >
              Tareas
            </button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
              <Tooltip content={<ChartTooltip label={viewMode === 'points' ? 'Puntos' : 'Tareas'} />} cursor={{ fill: isDark ? '#3D3D3D40' : '#E5E6E640' }} />
              <Bar dataKey={viewMode === 'points' ? 'points' : 'total'} radius={[0, 4, 4, 0]} barSize={20}>
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-[#303030] p-6 rounded-xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
        <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60 mb-4">Ranking de la semana</h3>
        <div className="space-y-4">
          {sortedData.slice(0, 3).map((item, index) => (
            <div key={item.name} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-[#E5E6E6] dark:bg-[#3D3D3D] flex items-center justify-center font-bold text-[#1E1E1E]/50 dark:text-white/50 text-sm">
                #{index + 1}
              </div>
              <Avatar
                member={{ name: item.name, color: item.color, avatar_url: item.avatar_url } as Member}
                className="w-10 h-10 text-base"
              />
              <div className="flex-1">
                <p className="font-medium text-[#1E1E1E] dark:text-white">{item.name}</p>
              </div>
              <div className="flex items-center gap-4">
                {item.thanks > 0 && (
                  <div className="flex items-center gap-1 text-[#E01B24] dark:text-[#FF6B6B]">
                    <Heart className="w-4 h-4" fill="currentColor" />
                    <span className="text-sm font-medium">{item.thanks}</span>
                  </div>
                )}
                <div className="flex flex-col items-end">
                  <div className="font-bold text-lg text-[#1E1E1E] dark:text-white leading-none flex items-center gap-1">
                    {viewMode === 'points' && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                    {viewMode === 'points' ? item.points : item.total}
                  </div>
                  <div className="text-xs text-[#1E1E1E]/50 dark:text-white/50">
                    {viewMode === 'points' ? `${item.total} tareas` : `${item.points} pts`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ThanksRankingCard data={thanksRanking} />
    </div>
  );
}
