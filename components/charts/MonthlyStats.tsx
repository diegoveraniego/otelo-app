'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { startOfMonth, endOfMonth, getDaysInMonth, format } from 'date-fns';
import { Member, Chore, Log } from '@/lib/types';
import ChartTooltip from './ChartTooltip';
import { useTheme } from 'next-themes';

export default function MonthlyStats() {
  const [choreData, setChoreData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [lineData, setLineData] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    const { data: mData } = await supabase.from('members').select('*');
    const { data: cData } = await supabase.from('chores').select('*');
    if (!mData || !cData) return;
    setMembers(mData);

    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .gte('done_at', start.toISOString())
      .lte('done_at', end.toISOString());

    if (logs) {
      // Per-chore breakdown (stacked bar)
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
      }).sort((a, b) => b.total - a.total).slice(0, 5); // top 5 chores
      
      setChoreData(cStats);

      // Heatmap Data (Days x Members)
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

      // Line Chart Data (Days)
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
        <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60 mb-6">Mapa de calor (Mes actual)</h3>
        <div className="overflow-x-auto pb-2 -mx-2 px-2">
          <div className="min-w-max space-y-2">
            {heatmapData.map((row) => (
              <div key={row.member.id} className="flex items-center gap-2">
                <div className="w-16 truncate font-medium text-[#1E1E1E]/70 dark:text-white/70">{row.member.name}</div>
                <div className="flex gap-1">
                  {row.activity.map((count: number, idx: number) => (
                    <div 
                      key={idx}
                      className="w-4 h-4 rounded-sm"
                      style={{ 
                        backgroundColor: count > 0 ? row.member.color : '#3D3D3D',
                        opacity: count > 0 ? Math.min(0.4 + (count * 0.2), 1) : 1
                      }}
                      title={`Día ${idx + 1}: ${count} tareas`}
                    />
                  ))}
                </div>
              </div>
            ))}
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
    </div>
  );
}
