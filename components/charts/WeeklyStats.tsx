'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { startOfWeek, endOfWeek } from 'date-fns';
import { Member } from '@/lib/types';
import ChartTooltip from './ChartTooltip';
import { useTheme } from 'next-themes';
import Avatar from '@/components/Avatar';

type StatsData = {
  name: string;
  color: string;
  total: number;
  avatar_url?: string | null;
};

export default function WeeklyStats() {
  const [data, setData] = useState<StatsData[]>([]);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const end = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

    const { data: members } = await supabase.from('members').select('*');
    if (!members) return;

    const { data: logs } = await supabase
      .from('logs')
      .select('member_id')
      .gte('done_at', start)
      .lte('done_at', end);

    if (logs) {
      const stats = members.map((m: Member) => ({
        name: m.name,
        color: m.color,
        total: logs.filter(l => l.member_id === m.id).length,
        avatar_url: m.avatar_url ?? null,
      })).sort((a, b) => b.total - a.total);
      
      setData(stats);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-white dark:bg-[#303030] p-6 rounded-xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
        <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60 mb-6">Tareas esta semana</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: isDark ? '#3D3D3D40' : '#E5E6E640' }} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, index) => (
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
          {data.slice(0, 3).map((item, index) => (
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
              <div className="font-bold text-lg text-[#1E1E1E] dark:text-white">{item.total}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
