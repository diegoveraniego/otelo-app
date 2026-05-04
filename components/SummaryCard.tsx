'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { startOfWeek, endOfWeek } from 'date-fns';

export default function SummaryCard() {
  const { currentUser } = useUserStore();
  const [userCount, setUserCount] = useState(0);
  const [familyAvg, setFamilyAvg] = useState(0);

  useEffect(() => {
    fetchStats();

    const handleRefresh = () => fetchStats();
    window.addEventListener('chore-logged', handleRefresh);
    return () => window.removeEventListener('chore-logged', handleRefresh);
  }, [currentUser]);

  const fetchStats = async () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const end = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

    // Fetch all logs for this week
    const { data: logs } = await supabase
      .from('logs')
      .select('member_id')
      .gte('done_at', start)
      .lte('done_at', end);

    if (logs) {
      // Calculate unique members who did something, or use all 7 members
      const { data: members } = await supabase.from('members').select('id');
      const memberCount = members?.length || 1;
      
      const totalLogs = logs.length;
      const avg = Math.round(totalLogs / memberCount);
      setFamilyAvg(avg);

      if (currentUser) {
        const uCount = logs.filter(log => log.member_id === currentUser.id).length;
        setUserCount(uCount);
      }
    }
  };

  if (!currentUser) return null;

  return (
    <div className="bg-[#3584E4] dark:bg-[#303030] rounded-xl p-6 text-white shadow-md mb-8 overflow-hidden relative border border-[#1C71D8] dark:border-[#3D3D3D] transition-colors">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <h2 className="text-white/80 font-medium mb-1">Esta semana</h2>
        <div className="flex items-end gap-3 mb-6">
          <span className="text-5xl font-bold tracking-tight">{userCount}</span>
          <span className="text-white/80 pb-1.5">tareas</span>
        </div>

        <div className="bg-black/10 dark:bg-black/20 rounded-lg p-4 backdrop-blur-sm border border-white/10">
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-300">Promedio familiar</span>
            <span className="font-semibold text-white">{familyAvg} tareas</span>
          </div>
          
          {/* Simple progress bar */}
          <div className="h-2 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, (userCount / (Math.max(1, familyAvg * 2))) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
