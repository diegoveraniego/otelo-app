'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { startOfWeek, endOfWeek, subWeeks, isSunday, isMonday, isFriday, isSaturday } from 'date-fns';
import { Trophy, Star, Sparkles, Flame, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { Member } from '@/lib/types';
import Avatar from './Avatar';
import { useUserStore } from '@/lib/store';

type ChoreBreakdown = {
  name: string;
  emoji: string;
  pointsEach: number;
  count: number;
  totalPts: number;
};

type MemberResult = {
  member: Member;
  points: number;
  tasks: number;
  breakdown: ChoreBreakdown[];
};

type BannerData = {
  mode: 'sunday' | 'monday';
  topMember?: Member | null;
  allResults?: MemberResult[];
  candidates?: Member[];
  totalChores: number;
  topCount?: number;
  topPoints?: number;
};

const joinNames = (names: string[]) => {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
};

function MemberRow({ result, isWinner, rank }: { result: MemberResult; isWinner: boolean; rank: number }) {
  const [open, setOpen] = useState(false);
  const maxPts = result.points; // used internally, parent handles global max

  return (
    <div className={`rounded-xl border transition-all duration-200 ${open ? 'border-[#3584E4]/30 dark:border-[#3584E4]/20 bg-[#3584E4]/[0.03] dark:bg-[#3584E4]/[0.06]' : 'border-transparent'}`}>
      {/* Row header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-[#FAFAFA] dark:hover:bg-white/5 transition-colors text-left"
      >
        <span className="text-[10px] font-black text-[#1E1E1E]/30 dark:text-white/30 w-4 text-right shrink-0">
          #{rank}
        </span>
        <Avatar member={result.member} className="w-7 h-7 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className={`text-xs font-bold truncate ${isWinner ? 'text-amber-600 dark:text-amber-400' : 'text-[#1E1E1E] dark:text-white'}`}>
              {result.member.name} {isWinner && '👑'}
            </span>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-xs font-black text-[#1E1E1E] dark:text-white flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                {result.points} pts
              </span>
              <span className="text-[10px] text-[#1E1E1E]/40 dark:text-white/40 font-medium">
                {result.tasks} {result.tasks === 1 ? 'tarea' : 'tareas'}
              </span>
              {open ? (
                <ChevronUp className="w-3 h-3 text-[#1E1E1E]/30 dark:text-white/30" />
              ) : (
                <ChevronDown className="w-3 h-3 text-[#1E1E1E]/30 dark:text-white/30" />
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Chore breakdown */}
      {open && result.breakdown.length > 0 && (
        <div className="px-3 pb-3 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="border-t border-[#E5E6E6] dark:border-[#2C2C30] mb-2" />
          {result.breakdown.map(c => (
            <div key={c.name} className="flex items-center justify-between text-[11px]">
              <span className="text-[#1E1E1E]/70 dark:text-white/60 font-medium flex items-center gap-1.5">
                <span>{c.emoji}</span>
                <span className="truncate">{c.name}</span>
                {c.count > 1 && (
                  <span className="text-[#1E1E1E]/40 dark:text-white/30">×{c.count}</span>
                )}
              </span>
              <span className="font-black text-[#1E1E1E] dark:text-white shrink-0 ml-2 flex items-center gap-0.5">
                <span className="text-[#1E1E1E]/30 dark:text-white/30 font-normal text-[10px]">
                  {c.count > 1 ? `${c.count} × ${c.pointsEach}` : `${c.pointsEach}`}
                </span>
                <span className="mx-1 text-[#1E1E1E]/20 dark:text-white/20">=</span>
                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                {c.totalPts}
              </span>
            </div>
          ))}
          {/* Total */}
          <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E6E6] dark:border-[#2C2C30]">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#1E1E1E]/40 dark:text-white/40">Total</span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              {result.points} pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsBreakdown({ results, winnerId }: { results: MemberResult[]; winnerId?: string }) {
  return (
    <div className="mt-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
      {results.map((r, i) => (
        <MemberRow key={r.member.id} result={r} isWinner={r.member.id === winnerId} rank={i + 1} />
      ))}
    </div>
  );
}

function buildResults(members: Member[], logs: any[]): MemberResult[] {
  const pointsMap: Record<string, number> = {};
  const taskMap: Record<string, number> = {};
  // breakdown: memberId -> choreName -> { emoji, pointsEach, count }
  const breakdownMap: Record<string, Record<string, { emoji: string; pointsEach: number; count: number }>> = {};

  logs.forEach(l => {
    const chore = l.chore as any;
    const meta = l.metadata as any;
    const name = chore?.name ?? 'Tarea';
    const emoji = chore?.emoji ?? '✅';
    const mid = l.member_id;

    taskMap[mid] = (taskMap[mid] || 0) + 1;

    // If log has subtasks in metadata, use those for breakdown
    if (meta?.subtasks && Array.isArray(meta.subtasks)) {
      const subList = meta.subtasks as { name: string; points: number }[];
      subList.forEach(sub => {
        const key = `${name} › ${sub.name}`;
        if (!breakdownMap[mid]) breakdownMap[mid] = {};
        if (!breakdownMap[mid][key]) breakdownMap[mid][key] = { emoji, pointsEach: sub.points, count: 0 };
        breakdownMap[mid][key].count += 1;
        pointsMap[mid] = (pointsMap[mid] || 0) + sub.points;
      });
    } else {
      // Use points_earned from metadata if available (co-op bonus etc), else chore points
      const pts = meta?.points_earned ?? chore?.points ?? 1;
      pointsMap[mid] = (pointsMap[mid] || 0) + pts;
      if (!breakdownMap[mid]) breakdownMap[mid] = {};
      if (!breakdownMap[mid][name]) breakdownMap[mid][name] = { emoji, pointsEach: pts, count: 0 };
      breakdownMap[mid][name].count += 1;
    }
  });

  return members
    .map(m => ({
      member: m,
      points: pointsMap[m.id] || 0,
      tasks: taskMap[m.id] || 0,
      breakdown: Object.entries(breakdownMap[m.id] || {})
        .map(([name, v]) => ({
          name,
          emoji: v.emoji,
          pointsEach: v.pointsEach,
          count: v.count,
          totalPts: v.pointsEach * v.count,
        }))
        .sort((a, b) => b.totalPts - a.totalPts),
    }))
    .filter(x => x.points > 0)
    .sort((a, b) => b.points - a.points);
}

export default function WeeklySummaryBanner() {
  const { currentUser } = useUserStore();
  const [data, setData] = useState<BannerData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
        .select('member_id, metadata, chore:chores(points, name, emoji)')
        .eq('home_id', currentUser.home_id)
        .gte('done_at', start)
        .lte('done_at', end);

      const logsList = logs ?? [];
      const allResults = buildResults(members as Member[], logsList);
      const topCandidates = allResults.slice(0, 3).map(x => x.member);

      setData({
        mode: 'sunday',
        candidates: topCandidates,
        allResults,
        totalChores: logsList.length,
      });

    } else if (isMon) {
      const lastWeek = subWeeks(today, 1);
      const start = startOfWeek(lastWeek, { weekStartsOn: 1 }).toISOString();
      const end = endOfWeek(lastWeek, { weekStartsOn: 1 }).toISOString();

      const { data: logs } = await supabase
        .from('logs')
        .select('member_id, metadata, chore:chores(points, name, emoji)')
        .eq('home_id', currentUser.home_id)
        .gte('done_at', start)
        .lte('done_at', end);

      const logsList = logs ?? [];
      if (logsList.length > 0) {
        const allResults = buildResults(members as Member[], logsList);
        const winner = allResults[0];

        setData({
          mode: 'monday',
          topMember: winner?.member ?? null,
          allResults,
          totalChores: logsList.length,
          topCount: winner?.tasks,
          topPoints: winner?.points,
        });
      }
    }
  }, [currentUser?.home_id, isSun, isMon, today, isFri, isSat]);

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
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4">
          {hasCandidates ? (
            <div className="flex -space-x-3 items-center shrink-0 bg-[#FAFAFA] dark:bg-[#151518] p-1.5 rounded-full border border-[#E5E6E6] dark:border-[#2C2C30] mt-1">
              {data.candidates?.map((candidate, idx) => (
                <div key={candidate.id} className="relative transition-transform hover:scale-110" style={{ zIndex: 30 - idx }}>
                  <Avatar member={candidate} className="w-12 h-12 border-2 border-white dark:border-[#303030] shadow-sm" />
                  {idx === 0 && (
                    <div className="absolute -top-2 -right-1 bg-amber-400 rounded-full p-0.5 shadow-sm border border-white dark:border-[#303030]">
                      <Crown className="w-3 h-3 text-neutral-900 fill-neutral-900" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="shrink-0 flex items-center justify-center bg-[#FAFAFA] dark:bg-[#151518] w-14 h-14 rounded-full border border-[#E5E6E6] dark:border-[#2C2C30]">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
          )}
          
          <div className="flex-1 w-full">
            <h3 className="text-xs font-black uppercase tracking-wider opacity-60 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              La Carrera de la Semana
            </h3>
            <p className="text-base font-bold leading-snug mt-0.5">
              {hasCandidates ? (
                <>¡<span className="text-amber-600 dark:text-amber-400">{joinNames(candidateNames)}</span> son los candidatos a la estrella! 🌟</>
              ) : (
                "¡La carrera por la estrella de la semana está abierta! 🏁"
              )}
            </p>
            <p className="text-xs opacity-60 mt-1 font-medium">
              {hasCandidates 
                ? "¿Quién se llevará la corona definitiva a medianoche? ¡Sigue sumando tareas!"
                : "Sé el primero en completar una tarea para liderar el ranking semanal."
              }
            </p>

            {hasCandidates && data.allResults && data.allResults.length > 0 && (
              <>
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#1E1E1E]/40 dark:text-white/40 hover:text-[#3584E4] dark:hover:text-[#5B9DF5] transition-colors"
                >
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expanded ? 'Ocultar ranking' : 'Ver ranking completo'}
                </button>
                {expanded && (
                  <ResultsBreakdown results={data.allResults} winnerId={data.candidates?.[0]?.id} />
                )}
              </>
            )}
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
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4">
          <div className="relative shrink-0 mt-1">
            <Avatar member={data.topMember} className="w-16 h-16 border-4 border-[#FAFAFA] dark:border-[#242424] shadow-sm" />
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#1A1A1E] rounded-full p-1 shadow-sm border border-[#E5E6E6] dark:border-[#2C2C30]">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
          </div>
          
          <div className="flex-1 w-full">
            <h3 className="text-xs font-black uppercase tracking-wider opacity-60 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Resumen Semanal
            </h3>
            <p className="text-base font-bold leading-snug mt-0.5">
              ¡<span className="text-amber-600 dark:text-amber-400">{data.topMember.name}</span> fue la estrella de la semana pasada! 🌟
            </p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs font-bold bg-[#FAFAFA] dark:bg-[#151518] rounded-lg px-3 py-2 w-fit border border-[#E5E6E6] dark:border-[#2C2C30]">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{data.topPoints} pts</span>
              </div>
              <div className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{data.topCount} tareas</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#E01B24] dark:text-[#FF6B6B]" />
                <span>{data.totalChores} en familia</span>
              </div>
            </div>

            {data.allResults && data.allResults.length > 1 && (
              <>
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#1E1E1E]/40 dark:text-white/40 hover:text-[#3584E4] dark:hover:text-[#5B9DF5] transition-colors"
                >
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expanded ? 'Ocultar desglose' : 'Ver por qué ganó'}
                </button>
                {expanded && (
                  <ResultsBreakdown results={data.allResults} winnerId={data.topMember.id} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
