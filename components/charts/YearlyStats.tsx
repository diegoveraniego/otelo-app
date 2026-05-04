'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { startOfYear, endOfYear } from 'date-fns';
import { Member, Chore } from '@/lib/types';
import ChartTooltip from './ChartTooltip';
import { useTheme } from 'next-themes';
import Avatar from '@/components/Avatar';

export default function YearlyStats() {
  const [data, setData] = useState<any[]>([]);
  const [topChores, setTopChores] = useState<any[]>([]);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const start = startOfYear(new Date()).toISOString();
    const end = endOfYear(new Date()).toISOString();

    const { data: members } = await supabase.from('members').select('*');
    const { data: chores } = await supabase.from('chores').select('*');
    if (!members || !chores) return;

    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .gte('done_at', start)
      .lte('done_at', end);

    if (logs) {
      // Total per person
      const stats = members.map((m: Member) => ({
        name: m.name,
        color: m.color,
        total: logs.filter(l => l.member_id === m.id).length
      })).sort((a, b) => b.total - a.total);
      setData(stats);

      // Most done chore per person
      const tops = members.map((m: Member) => {
        const mLogs = logs.filter(l => l.member_id === m.id);
        if (mLogs.length === 0) return { member: m, chore: null, count: 0 };
        
        const counts: Record<string, number> = {};
        mLogs.forEach(l => {
          counts[l.chore_id] = (counts[l.chore_id] || 0) + 1;
        });
        
        const topChoreId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        const chore = chores.find((c: Chore) => c.id === topChoreId);
        
        return { member: m, chore, count: counts[topChoreId] };
      }).filter(t => t.chore !== null);
      
      setTopChores(tops);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-white dark:bg-[#303030] p-6 rounded-xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
        <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60 mb-6">Total Anual por Persona</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: isDark ? '#3D3D3D40' : '#E5E6E640' }} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-[#303030] p-6 rounded-xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
        <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60 mb-4">Tarea Favorita por Persona</h3>
        <div className="space-y-4">
          {topChores.map((item) => (
            <div key={item.member.id} className="flex items-center gap-4">
              <Avatar member={item.member} className="w-10 h-10 text-base" />
              <div className="flex-1">
                <p className="font-medium text-[#1E1E1E] dark:text-white">{item.member.name}</p>
                <p className="text-sm text-[#1E1E1E]/50 dark:text-white/50">{item.chore.name}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-2xl">{item.chore.emoji}</div>
                <div className="text-xs font-medium text-[#1E1E1E]/40 dark:text-white/40">{item.count} veces</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
