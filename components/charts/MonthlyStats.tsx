'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { startOfMonth, endOfMonth, getDaysInMonth, format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Member, Chore, Log } from '@/lib/types';
import ChartTooltip from './ChartTooltip';
import ThanksRankingCard, { ThanksRankingEntry } from './ThanksRankingCard';
import { useTheme } from 'next-themes';
import { Flame } from 'lucide-react';

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

export default function MonthlyStats({ currentDate }: { currentDate: Date }) {
  const [choreData, setChoreData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [lineData, setLineData] = useState<any[]>([]);
  const [memberStreaks, setMemberStreaks] = useState<Record<string, number>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [thanksRanking, setThanksRanking] = useState<ThanksRankingEntry[]>([]);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const fetchStats = async () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);

    const { data: mData } = await supabase.from('members').select('*');
    const { data: cData } = await supabase.from('chores').select('*');
    if (!mData || !cData) return;
    setMembers(mData);

    const [{ data: logs }, { data: thanks }, { data: allLogs }] = await Promise.all([
      supabase.from('logs').select('*').gte('done_at', start.toISOString()).lte('done_at', end.toISOString()),
      supabase.from('thanks').select('to_member_id').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('logs').select('done_at,member_id').gte('done_at', subDays(new Date(), 60).toISOString()),
    ]);

    if (allLogs) {
      const streaks: Record<string, number> = {};
      mData.forEach(m => {
        const memberLogs = allLogs.filter(l => l.member_id === m.id).map(l => l.done_at);
        streaks[m.id] = calcStreak(memberLogs);
      });
      setMemberStreaks(streaks);
    }

    setThanksRanking(
      mData.map((m: Member) => ({
        member: m,
        count: thanks?.filter(t => t.to_member_id === m.id).length ?? 0,
      }))
    );

    if (logs) {
      const cStats = cData.map(chore => {
        const item: any = { name: chore.name, emoji: chore.emoji };
        let total = 0;
        mData.forEach(m => {
          const count = logs.filter(l => l.chore_id === chore.id && l.member_id === m.id).length;
          item[m.name] = count;
          total += count;
        });
        item.total = total;
        return item;
      }).sort((a, b) => b.total - a.total).slice(0, 5);
      
      setChoreData(cStats);

      const days = getDaysInMonth(start);
      const hData = mData.map(m => {
        const activity = Array.from({ length: days }, (_, i) => {
          const dayString = format(new Date(start.getFullYear(), start.getMonth(), i + 1), 'yyyy-MM-dd');
          const count = logs.filter(l => l.member_id === m.id && l.done_at.startsWith(dayString)).length;
          return count;
        });
        return { member: m, activity };
      });
      setHeatmapData(hData);

      const lData = Array.from({ length: days }, (_, i) => {
        const dayString = format(new Date(start.getFullYear(), start.getMonth(), i + 1), 'yyyy-MM-dd');
        const dayItem: any = { day: (i + 1).toString() };
        mData.forEach(m => {
          dayItem[m.name] = logs.filter(l => l.member_id === m.id && l.done_at.startsWith(dayString)).length;
        });
        return dayItem;
      });
      setLineData(lData);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-white dark:bg-[#303030] p-6 rounded-xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] overflow-hidden text-xs transition-colors">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60 capitalize">
            Mapa de calor ({format(currentDate, 'MMMM yyyy', { locale: es })})
          </h3>
        </div>
        {heatmapData.length > 0 && (
          <div className="mb-4 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 dark:border-amber-800/50">
            La familia lleva {Math.max(...heatmapData.map(r => r.activity.filter((c: number) => c > 0).length))} días activa este mes.
          </div>
        )}
        <div className="overflow-x-auto pb-2 -mx-2 px-2 max-w-full">
          <div className="min-w-max space-y-1.5 sm:space-y-2">
            {heatmapData.map((row) => {
              const streak = memberStreaks[row.member.id] || 0;
              return (
                <div key={row.member.id} className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex flex-col w-20">
                    <div className="truncate font-medium text-[#1E1E1E]/70 dark:text-white/70">{row.member.name}</div>
                    {streak >= 2 && (
                      <div className="flex items-center gap-0.5 text-[10px] text-orange-500 dark:text-orange-400">
                        <Flame className="w-3 h-3" />
                        <span>{streak} días</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-0.5 sm:gap-1">
                    {row.activity.map((count: number, idx: number) => (
                      <div 
                        key={idx}
                        className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8 rounded-sm transition-all"
                        style={{ 
                          backgroundColor: count > 0 ? row.member.color : (isDark ? '#3D3D3D' : '#E5E6E6'),
                          opacity: count > 0 ? Math.min(0.4 + (count * 0.2), 1) : 1
                        }}
                        title={`Día ${idx + 1}: ${count} tareas`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#303030] p-6 rounded-xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
        <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60 mb-6">Tendencia Diaria</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: isDark ? '#3D3D3D40' : '#E5E6E640' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              {members.map(m => (
                <Line 
                  key={m.id} 
                  type="monotone" 
                  dataKey={m.name} 
                  stroke={m.color} 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-[#303030] p-6 rounded-xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
        <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60 mb-6">Top Tareas por Persona</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={choreData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="emoji" type="category" axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: isDark ? '#3D3D3D40' : '#E5E6E640' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              {members.map(m => (
                <Bar key={m.id} dataKey={m.name} stackId="a" fill={m.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ThanksRankingCard data={thanksRanking} />
    </div>
  );
}
