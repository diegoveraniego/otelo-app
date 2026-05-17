'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { startOfWeek, endOfWeek, subWeeks, isSunday, isMonday } from 'date-fns';
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
  const isSun = isSunday(today);
  const isMon = isMonday(today);
  const shouldShow = isSun || isMon;

  const fetchBannerData = useCallback(async () => {
    if (!currentUser?.home_id) return;

    const { data: members } = await supabase
      .from('members')
      .select('*')
      .eq('home_id', currentUser.home_id);
      
    if (!members || members.length === 0) return;

    if (isSun) {
      // --- SUNDAY MODE: Candidates for the ending week ---
      const start = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
      const end = endOfWeek(today, { weekStartsOn: 1 }).toISOString();

      const { data: logs } = await supabase
        .from('logs')
        .select('member_id')
        .eq('home_id', currentUser.home_id)
        .gte('done_at', start)
        .lte('done_at', end);

      const logsList = logs ?? [];
      const counts: Record<string, number> = {};
      logsList.forEach(l => {
        counts[l.member_id] = (counts[l.member_id] || 0) + 1;
      });

      // Map, filter those with at least 1 task, sort descending
      const sortedCandidates = (members as Member[])
        .map(m => ({ member: m, count: counts[m.id] || 0 }))
        .filter(x => x.count > 0)
        .sort((a, b) => b.count - a.count);

      const topCandidates = sortedCandidates.slice(0, 3).map(x => x.member);

      setData({
        mode: 'sunday',
        candidates: topCandidates,
        totalChores: logsList.length
      });

    } else if (isMon) {
      // --- MONDAY MODE: Crowning the winner of last week ---
      const lastWeek = subWeeks(today, 1);
      const start = startOfWeek(lastWeek, { weekStartsOn: 1 }).toISOString();
      const end = endOfWeek(lastWeek, { weekStartsOn: 1 }).toISOString();

      const { data: logs } = await supabase
        .from('logs')
        .select('member_id')
        .eq('home_id', currentUser.home_id)
        .gte('done_at', start)
        .lte('done_at', end);

      const logsList = logs ?? [];
      if (logsList.length > 0) {
        const counts: Record<string, number> = {};
        logsList.forEach(l => {
          counts[l.member_id] = (counts[l.member_id] || 0) + 1;
        });

        const topMemberId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        const topMember = (members as Member[]).find(m => m.id === topMemberId);

        setData({
          mode: 'monday',
          topMember: topMember || null,
          totalChores: logsList.length,
          topCount: counts[topMemberId]
        });
      }
    }
  }, [currentUser?.home_id, isSun, isMon]);

  useEffect(() => {
    setMounted(true);
    if (shouldShow && currentUser?.home_id) {
      fetchBannerData();

      // Listen to logged chores so Sunday candidates update in real time!
      const handleRefresh = () => fetchBannerData();
      window.addEventListener('chore-logged', handleRefresh);
      return () => window.removeEventListener('chore-logged', handleRefresh);
    }
  }, [shouldShow, currentUser?.home_id, fetchBannerData]);

  if (!mounted || !shouldShow || !data) return null;

  // --- SUNDAY BANNER RENDERING ---
  if (data.mode === 'sunday') {
    const candidateNames = data.candidates?.map(c => c.name) ?? [];
    const hasCandidates = candidateNames.length > 0;

    return (
      <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-700 dark:via-indigo-600 dark:to-purple-700 rounded-2xl p-4 mb-6 text-white shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700 border border-white/10">
        {/* Decorative Background Icon */}
        <div className="absolute top-0 right-0 p-2 opacity-15 pointer-events-none">
          <Sparkles className="w-24 h-24 rotate-12" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {/* Overlapping Avatars of Candidates */}
          {hasCandidates ? (
            <div className="flex -space-x-3 items-center shrink-0 bg-white/10 p-1.5 rounded-full backdrop-blur-sm shadow-inner border border-white/10">
              {data.candidates?.map((candidate, idx) => (
                <div key={candidate.id} className="relative transition-transform hover:scale-110" style={{ zIndex: 30 - idx }}>
                  <Avatar 
                    member={candidate} 
                    className="w-12 h-12 border-2 border-indigo-400 shadow-md"
                  />
                  {idx === 0 && (
                    <div className="absolute -top-2 -right-1 bg-yellow-400 rounded-full p-0.5 shadow">
                      <Crown className="w-3 h-3 text-neutral-900 fill-neutral-900" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="relative shrink-0 flex items-center justify-center bg-white/15 w-14 h-14 rounded-full border-2 border-white/20 shadow-md">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="text-xs font-black uppercase tracking-wider opacity-90 flex items-center gap-1.5 justify-center sm:justify-start">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              La Carrera de la Semana
            </h3>
            
            <p className="text-base font-bold leading-snug drop-shadow-sm mt-0.5">
              {hasCandidates ? (
                <>
                  ¡<span className="text-yellow-200">{joinNames(candidateNames)}</span> son los candidatos a la estrella de la semana! 🌟
                </>
              ) : (
                "¡La carrera por la estrella de la semana está abierta! 🏁"
              )}
            </p>
            
            <p className="text-xs opacity-90 mt-1 font-medium">
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

  // --- MONDAY BANNER RENDERING ---
  if (data.mode === 'monday' && data.topMember) {
    return (
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-700 rounded-2xl p-4 mb-6 text-white shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700 border border-white/10">
        {/* Decorative Background Icon */}
        <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
          <Trophy className="w-24 h-24 rotate-12" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="relative shrink-0">
            <Avatar member={data.topMember} className="w-16 h-16 border-4 border-white/30 shadow-xl" />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xs font-black uppercase tracking-wider opacity-90 flex items-center gap-1.5 justify-center sm:justify-start">
              <Trophy className="w-3.5 h-3.5 text-yellow-300" />
              Resumen Semanal
            </h3>
            <p className="text-base font-bold leading-snug drop-shadow-sm mt-0.5">
              ¡<span className="text-amber-100">{data.topMember.name}</span> fue la estrella de la semana pasada! 🌟
            </p>
            <div className="flex gap-4 mt-2 text-xs font-bold bg-black/10 rounded-lg p-2 w-fit backdrop-blur-sm border border-white/5 mx-auto sm:mx-0">
              <div className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                <span>{data.topCount} tareas</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
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
