'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { Member } from '@/lib/types';
import {
  startOfWeek, endOfWeek, subWeeks, format
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Trophy, Star, Crown, ChevronDown, ChevronUp, Flame, Medal } from 'lucide-react';
import Avatar from '@/components/Avatar';

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

type WeekRecord = {
  label: string;
  start: string;
  end: string;
  results: MemberResult[];
  winner: MemberResult | null;
  isTie: boolean;
};

function buildResults(members: Member[], logs: any[]): MemberResult[] {
  const pointsMap: Record<string, number> = {};
  const taskMap: Record<string, number> = {};
  const breakdownMap: Record<string, Record<string, { emoji: string; pointsEach: number; count: number }>> = {};

  logs.forEach(l => {
    const chore = l.chore as any;
    const meta = l.metadata as any;
    const name = chore?.name ?? 'Tarea';
    const emoji = chore?.emoji ?? '✅';
    const mid = l.member_id;

    taskMap[mid] = (taskMap[mid] || 0) + 1;

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
    .filter(x => x.tasks > 0)
    .sort((a, b) => b.points - a.points);
}

function MemberRow({ result, rank, isWinner }: { result: MemberResult; rank: number; isWinner: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-xl border transition-all ${open ? 'border-[#3584E4]/30 dark:border-[#3584E4]/20 bg-[#3584E4]/[0.03] dark:bg-[#3584E4]/[0.05]' : 'border-transparent'}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#FAFAFA] dark:hover:bg-white/5 transition-colors text-left"
      >
        {/* Rank badge */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
          rank === 1 ? 'bg-amber-400 text-neutral-900' :
          rank === 2 ? 'bg-neutral-300 dark:bg-neutral-600 text-neutral-900 dark:text-white' :
          rank === 3 ? 'bg-amber-700/70 text-white' :
          'bg-[#F0F0F0] dark:bg-[#2C2C30] text-[#1E1E1E]/40 dark:text-white/40'
        }`}>
          {rank === 1 ? <Crown className="w-3.5 h-3.5" /> : rank}
        </div>

        <Avatar member={result.member} className="w-9 h-9 shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold truncate ${isWinner ? 'text-amber-600 dark:text-amber-400' : 'text-[#1E1E1E] dark:text-white'}`}>
              {result.member.name}
            </span>
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <span className="text-sm font-black text-[#1E1E1E] dark:text-white flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {result.points} pts
              </span>
              <span className="text-[11px] text-[#1E1E1E]/40 dark:text-white/40 font-medium">
                {result.tasks} tareas
              </span>
              {open ? <ChevronUp className="w-3.5 h-3.5 text-[#1E1E1E]/30 dark:text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-[#1E1E1E]/30 dark:text-white/30" />}
            </div>
          </div>
          {/* Points bar */}
          <div className="h-1 w-full bg-[#E5E6E6] dark:bg-[#2C2C30] rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${result.points}%`,
                backgroundColor: isWinner ? '#f59e0b' : result.member.color,
              }}
            />
          </div>
        </div>
      </button>

      {open && result.breakdown.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="border-t border-[#E5E6E6] dark:border-[#2C2C30] mb-2" />
          {result.breakdown.map(c => (
            <div key={c.name} className="flex items-center justify-between text-[11px]">
              <span className="text-[#1E1E1E]/70 dark:text-white/60 font-medium flex items-center gap-1.5 truncate">
                <span>{c.emoji}</span>
                <span className="truncate">{c.name}</span>
                {c.count > 1 && <span className="text-[#1E1E1E]/40 dark:text-white/30 shrink-0">×{c.count}</span>}
              </span>
              <span className="font-black text-[#1E1E1E] dark:text-white shrink-0 ml-2 flex items-center gap-1">
                <span className="text-[#1E1E1E]/30 dark:text-white/30 font-normal">
                  {c.count > 1 ? `${c.count}×${c.pointsEach}` : `${c.pointsEach}`}
                </span>
                <span className="text-[#1E1E1E]/20 dark:text-white/20">=</span>
                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                {c.totalPts}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E6E6] dark:border-[#2C2C30]">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#1E1E1E]/40 dark:text-white/40">Total</span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              {result.points} pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function WeekCard({ week, defaultOpen = false }: { week: WeekRecord; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="sketchy-border overflow-hidden transition-colors">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 p-5 hover:bg-[#FAFAFA] dark:hover:bg-white/5 transition-colors text-left"
      >
        {/* Winner avatar / tie */}
        <div className="shrink-0 relative">
          {week.isTie ? (
            <div className="w-14 h-14 rounded-full bg-[#F0F0F0] dark:bg-[#252525] flex items-center justify-center text-2xl border-2 border-[#E5E6E6] dark:border-[#2C2C30]">
              🤝
            </div>
          ) : week.winner ? (
            <>
              <Avatar member={week.winner.member} className="w-14 h-14 border-2 border-amber-400 shadow-sm" />
              <div className="absolute -top-1.5 -right-1.5 bg-amber-400 rounded-full p-0.5 border-2 border-white dark:border-[#1A1A1E]">
                <Crown className="w-3 h-3 text-neutral-900 fill-neutral-900" />
              </div>
            </>
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#F0F0F0] dark:bg-[#252525] flex items-center justify-center border-2 border-[#E5E6E6] dark:border-[#2C2C30]">
              <Trophy className="w-6 h-6 text-[#1E1E1E]/20 dark:text-white/20" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#1E1E1E]/40 dark:text-white/40">{week.label}</p>
          {week.isTie ? (
            <p className="text-base font-bold text-[#1E1E1E] dark:text-white mt-0.5">¡Empate esta semana! 🤝</p>
          ) : week.winner ? (
            <p className="text-base font-bold text-[#1E1E1E] dark:text-white mt-0.5">
              🏆 <span className="text-amber-600 dark:text-amber-400">{week.winner.member.name}</span>
              <span className="text-[#1E1E1E]/50 dark:text-white/50 text-sm font-medium ml-2">
                · {week.winner.points} pts · {week.winner.tasks} tareas
              </span>
            </p>
          ) : (
            <p className="text-base font-bold text-[#1E1E1E]/30 dark:text-white/30 mt-0.5">Sin actividad</p>
          )}
        </div>

        <div className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-[#1E1E1E]/30 dark:text-white/30" />
        </div>
      </button>

      {/* Expanded ranking */}
      {open && week.results.length > 0 && (
        <div className="border-t border-[#E5E6E6] dark:border-[#2C2C30] p-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {week.results.map((r, i) => (
            <MemberRow
              key={r.member.id}
              result={r}
              rank={i + 1}
              isWinner={!week.isTie && week.winner?.member.id === r.member.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const { currentUser } = useUserStore();
  const [weeks, setWeeks] = useState<WeekRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    if (!currentUser?.home_id) return;
    setIsLoading(true);

    try {
      const { data: members } = await supabase
        .from('members')
        .select('*')
        .eq('home_id', currentUser.home_id);

      if (!members) return;

      // Fetch last 8 weeks
      const weekRecords: WeekRecord[] = [];
      const today = new Date();

      for (let w = 0; w < 8; w++) {
        const ref = subWeeks(today, w);
        const start = startOfWeek(ref, { weekStartsOn: 1 });
        const end = endOfWeek(ref, { weekStartsOn: 1 });

        const { data: logs } = await supabase
          .from('logs')
          .select('member_id, metadata, chore:chores(points, name, emoji)')
          .eq('home_id', currentUser.home_id)
          .gte('done_at', start.toISOString())
          .lte('done_at', end.toISOString());

        const logsList = logs ?? [];
        const results = buildResults(members as Member[], logsList);

        const topPts = results[0]?.points ?? 0;
        const tied = results.filter(r => r.points === topPts && topPts > 0).length > 1;
        const winner = results.length > 0 && !tied ? results[0] : null;

        const startLabel = format(start, "d MMM", { locale: es });
        const endLabel = format(end, "d MMM yyyy", { locale: es });

        weekRecords.push({
          label: w === 0 ? `Esta semana · ${startLabel} – ${endLabel}` : w === 1 ? `Semana pasada · ${startLabel} – ${endLabel}` : `${startLabel} – ${endLabel}`,
          start: start.toISOString(),
          end: end.toISOString(),
          results,
          winner,
          isTie: tied,
        });
      }

      setWeeks(weekRecords);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.home_id]);

  useEffect(() => {
    setMounted(true);
    if (currentUser?.home_id) fetchLeaderboard();
  }, [currentUser?.home_id, fetchLeaderboard]);

  if (!mounted || !currentUser) return null;

  return (
    <div className="animate-in fade-in duration-500 pb-8 mt-2 px-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-500/10 dark:bg-amber-500/20 p-2.5 rounded-xl text-amber-500">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] dark:text-white"><span className="highlighter-yellow">Leaderboard</span></h1>
          <p className="text-sm text-[#1E1E1E]/60 dark:text-white/60">
            Historial de ganadores semanales por puntos
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <span className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {weeks.map((week, i) => (
            <WeekCard key={week.start} week={week} defaultOpen={i === 1} />
          ))}
        </div>
      )}
    </div>
  );
}
