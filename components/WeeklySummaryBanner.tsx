'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { startOfWeek, endOfWeek, subWeeks, isSunday, isMonday, format } from 'date-fns';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { Member } from '@/lib/types';
import Avatar from './Avatar';

export default function WeeklySummaryBanner() {
  const [summary, setSummary] = useState<{
    topMember: Member | null;
    totalChores: number;
    topCount: number;
  } | null>(null);

  const today = new Date();
  const shouldShow = isSunday(today) || isMonday(today);

  useEffect(() => {
    if (shouldShow) {
      fetchWeeklySummary();
    }
  }, [shouldShow]);

  const fetchWeeklySummary = async () => {
    // Last week range
    const lastWeek = subWeeks(new Date(), 1);
    const start = startOfWeek(lastWeek, { weekStartsOn: 1 }).toISOString();
    const end = endOfWeek(lastWeek, { weekStartsOn: 1 }).toISOString();

    const { data: logs } = await supabase
      .from('logs')
      .select('member_id')
      .gte('done_at', start)
      .lte('done_at', end);

    if (logs && logs.length > 0) {
      const { data: members } = await supabase.from('members').select('*');
      if (!members) return;

      const counts: Record<string, number> = {};
      logs.forEach(l => {
        counts[l.member_id] = (counts[l.member_id] || 0) + 1;
      });

      const topMemberId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      const topMember = members.find(m => m.id === topMemberId);

      setSummary({
        topMember: topMember || null,
        totalChores: logs.length,
        topCount: counts[topMemberId]
      });
    }
  };

  if (!shouldShow || !summary || !summary.topMember) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-700 rounded-2xl p-4 mb-6 text-white shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="absolute top-0 right-0 p-2 opacity-20">
        <Trophy className="w-24 h-24 rotate-12" />
      </div>
      
      <div className="relative z-10 flex items-center gap-4">
        <div className="relative">
          <Avatar member={summary.topMember} className="w-16 h-16 border-4 border-white/30 shadow-xl" />
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">Resumen Semanal</h3>
          <p className="text-lg font-bold leading-tight">
            ¡<span className="text-amber-100">{summary.topMember.name}</span> fue la estrella de la semana pasada! 🌟
          </p>
          <div className="flex gap-4 mt-2 text-xs font-medium bg-black/10 rounded-lg p-2 w-fit backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>{summary.topCount} tareas</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{summary.totalChores} totales en familia</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
