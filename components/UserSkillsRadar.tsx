'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function UserSkillsRadar() {
  const { currentUser } = useUserStore();
  const [data, setData] = useState<{ subject: string; value: number }[]>([]);

  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId) return;
    
    async function fetchData(id: string) {
      const { data: logs } = await supabase
        .from('logs')
        .select('chores(category, points)')
        .eq('member_id', id);
      
      if (!logs) return;
      
      const counts: Record<string, number> = {};
      logs.forEach((l: any) => {
        const cat = l.chores?.category || 'Otros';
        counts[cat] = (counts[cat] || 0) + (l.chores?.points || 1);
      });

      // Filter out empty and sort
      const formatted = Object.keys(counts)
        .map(key => ({
          subject: key,
          value: counts[key]
        }))
        .filter(item => item.value > 0);

      setData(formatted);
    }

    fetchData(userId);
  }, [currentUser]);

  if (!data || data.length < 3) return null; // Radar needs at least 3 points to look good

  return (
    <div className="bg-white dark:bg-[#1A1A1E] rounded-xl p-4 shadow-sm border border-[#E5E6E6] dark:border-[#2C2C30] transition-colors w-full mt-4">
      <h3 className="text-sm font-semibold text-[#1E1E1E]/60 dark:text-white/60 mb-2">Tus Skills</h3>
      <div className="h-[220px] w-full -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
            <PolarGrid stroke="#E5E6E6" className="dark:stroke-[#4D4D4D]" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#888', fontSize: 11, fontWeight: 500 }} 
            />
            <Radar 
              name="Skills" 
              dataKey="value" 
              stroke="#3584E4" 
              fill="#3584E4" 
              fillOpacity={0.35} 
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
