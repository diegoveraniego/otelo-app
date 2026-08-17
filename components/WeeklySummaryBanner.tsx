'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { startOfWeek, endOfWeek, subWeeks, isSunday, isMonday, isFriday, isSaturday } from 'date-fns';
import { Trophy, Star, Sparkles, Flame, Crown } from 'lucide-react';
import { Member } from '@/lib/types';
import Avatar from './Avatar';
import { useUserStore } from '@/lib/store';

type BannerData = {
  mode: 'sunday' | 'monday';
  topMember?: Member | null;
  candidates?: Member[];
  totalChores: number;
  topCount?: number;
};

const joinNames = (names: string[]) => {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
};

export default function WeeklySummaryBanner() {
  const { currentUser } = useUserStore();
  const [data, setData] = useState<BannerData | null>(null);
  const [mounted, setMounted] = useState(false);

  const today = new Date();
  const isFri = isFriday(today);
  const isSat = isSaturday(today);
  const isSun = isSunday(today);
  const isMon = isMonday(today);
  const shouldShow = isFri || isSat || isSun || isMon;

  const fetchBannerData = useCallback(async () => {
    if (!currentUser?.home_id) return;

    const { data: members } = await supabase
      .from('members')
      .select('*')
      .eq('home_id', currentUser.home_id);
      
    if (!members || members.length === 0) return;

    if (isFri || isSat || isSun) {
      const start = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
      const end = endOfWeek(today, { weekStartsOn: 1 }).toISOString();

      const { data: logs } = await supabase
        .from('logs')
        .select('member_id, chore:chores(points)')
        .eq('home_id', currentUser.home_id)
        .gte('done_at', start)
        .lte('done_at', end);

      const logsList = logs ?? [];
      const points: Record<string, number> = {};
      logsList.forEach(l => {
        const pts = (l.chore as any)?.points ?? 1;
        points[l.member_id] = (points[l.member_id] || 0) + pts;
      });

      const sortedCandidates = (members as Member[])
        .map(m => ({ member: m, pts: points[m.id] || 0 }))
        .filter(x => x.pts > 0)
        .sort((a, b) => b.pts - a.pts);

      const topCandidates = sortedCandidates.slice(0, 3).map(x => x.member);

      setData({
        mode: 'sunday',
        candidates: topCandidates,
        totalChores: logsList.length
      });

    } else if (isMon) {
      const lastWeek = subWeeks(today, 1);
      const start = startOfWeek(lastWeek, { weekStartsOn: 1 }).toISOString();
      const end = endOfWeek(lastWeek, { weekStartsOn: 1 }).toISOString();

      const { data: logs } = await supabase
        .from('logs')
        .select('member_id, chore:chores(points)')
        .eq('home_id', currentUser.home_id)
        .gte('done_at', start)
        .lte('done_at', end);

      const logsList = logs ?? [];
      if (logsList.length > 0) {
        const points: Record<string, number> = {};
        const taskCounts: Record<string, number> = {};
        logsList.forEach(l => {
          const pts = (l.chore as any)?.points ?? 1;
          points[l.member_id] = (points[l.member_id] || 0) + pts;
          taskCounts[l.member_id] = (taskCounts[l.member_id] || 0) + 1;
        });

        const topMemberId = Object.keys(points).reduce((a, b) => points[a] > points[b] ? a : b);
        const topMember = (members as Member[]).find(m => m.id === topMemberId);

        setData({
          mode: 'monday',
          topMember: topMember || null,
          totalChores: logsList.length,
          topCount: taskCounts[topMemberId]
        });
      }
    }
  }, [currentUser?.home_id, isSun, isMon, today, isFri, isSat]); // Added dependencies

  useEffect(() => {
    setMounted(true);
    if (shouldShow && currentUser?.home_id) {
      fetchBannerData();

      const handleRefresh = () => fetchBannerData();
      window.addEventListener('chore-logged', handleRefresh);
      return () => window.removeEventListener('chore-logged', handleRefresh);
    }
  }, [shouldShow, currentUser?.home_id, fetchBannerData]);

  if (!mounted || !shouldShow || !data) return null;

  if (data.mode === 'sunday') {
    const candidateNames = data.candidates?.map(c => c.name) ?? [];
    const hasCandidates = candidateNames.length > 0;

    return (
      <div className="bg-white dark:bg-[#1A1A1E] rounded-xl p-4 mb-6 text-[#1E1E1E] dark:text-white shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700 border border-[#E5E6E6] dark:border-[#2C2C30]">
        <div className="absolute top-0 right-0 p-2 opacity-[0.03] dark:opacity-10 pointer-events-none">
          <Sparkles className="w-24 h-24 rotate-12 text-[#1E1E1E] dark:text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {hasCandidates ? (
            <div className="flex -space-x-3 items-center shrink-0 bg-[#FAFAFA] dark:bg-[#151518] p-1.5 rounded-full border border-[#E5E6E6] dark:border-[#2C2C30]">
              {data.candidates?.map((candidate, idx) => (
                <div key={candidate.id} className="relative transition-transform hover:scale-110" style={{ zIndex: 30 - idx }}>
                  <Avatar 
                    member={candidate} 
                    className="w-12 h-12 border-2 border-white dark:border-[#303030] shadow-sm"
                  />
                  {idx === 0 && (
                    <div className="absolute -top-2 -right-1 bg-amber-400 rounded-full p-0.5 shadow-sm border border-white dark:border-[#303030]">
                      <Crown className="w-3 h-3 text-neutral-900 fill-neutral-900" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="relative shrink-0 flex items-center justify-center bg-[#FAFAFA] dark:bg-[#151518] w-14 h-14 rounded-full border border-[#E5E6E6] dark:border-[#2C2C30]">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="text-xs font-black uppercase tracking-wider opacity-60 flex items-center gap-1.5 justify-center sm:justify-start">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              La Carrera de la Semana
            </h3>
            
            <p className="text-base font-bold leading-snug mt-0.5">
              {hasCandidates ? (
                <>
                  ¡<span className="text-amber-600 dark:text-amber-400">{joinNames(candidateNames)}</span> son los candidatos a la estrella de la semana! 🌟
                </>
              ) : (
                "¡La carrera por la estrella de la semana está abierta! 🏁"
              )}
            </p>
            
            <p className="text-xs opacity-60 mt-1 font-medium">
              {hasCandidates 
                ? "¿Quién se llevará la corona definitiva a medianoche? ¡Sigue sumando tareas!"
                : "Sé el primero en completar una tarea hoy para liderar el ranking semanal."
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (data.mode === 'monday' && data.topMember) {
    return (
      <div className="bg-white dark:bg-[#1A1A1E] rounded-xl p-4 mb-6 text-[#1E1E1E] dark:text-white shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700 border border-[#E5E6E6] dark:border-[#2C2C30]">
        <div className="absolute top-0 right-0 p-2 opacity-[0.03] dark:opacity-10 pointer-events-none">
          <Trophy className="w-24 h-24 rotate-12 text-[#1E1E1E] dark:text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="relative shrink-0">
            <Avatar member={data.topMember} className="w-16 h-16 border-4 border-[#FAFAFA] dark:border-[#242424] shadow-sm" />
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#1A1A1E] rounded-full p-1 shadow-sm border border-[#E5E6E6] dark:border-[#2C2C30]">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xs font-black uppercase tracking-wider opacity-60 flex items-center gap-1.5 justify-center sm:justify-start">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Resumen Semanal
            </h3>
            <p className="text-base font-bold leading-snug mt-0.5">
              ¡<span className="text-amber-600 dark:text-amber-400">{data.topMember.name}</span> fue la estrella de la semana pasada! 🌟
            </p>
            <div className="flex gap-4 mt-2 text-xs font-bold bg-[#FAFAFA] dark:bg-[#151518] rounded-lg p-2 w-fit border border-[#E5E6E6] dark:border-[#2C2C30] mx-auto sm:mx-0">
              <div className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{data.topCount} tareas</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#E01B24] dark:text-[#FF6B6B]" />
                <span>{data.totalChores} totales en familia</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
