'use client';

import { FeedingSlotWithDetails } from '@/lib/types';
import { useUserStore } from '@/lib/store';
import Avatar from './Avatar';
import {
  DAY_NAMES, isSlotOverdue, isSlotNow, getWeeklyAssignmentCount
} from '@/lib/feedingUtils';
import { CheckCircle2, AlertTriangle, Plus, Clock } from 'lucide-react';

type Props = {
  slots: FeedingSlotWithDetails[];
  weekStart: string;
  petId?: string;
  onOpenModal: (slot: FeedingSlotWithDetails) => void;
};

const DAYS = 7;

export default function FeedingWeekGrid({ slots, weekStart, petId, onOpenModal }: Props) {
  const { currentUser } = useUserStore();
  const countMap = getWeeklyAssignmentCount(slots);

  // Build lookup: "morning-0", "evening-3" → slot
  const slotMap = new Map<string, FeedingSlotWithDetails>();
  slots.forEach((s) => {
    // Only map slots that belong to the current viewed week
    if (s.week_start === weekStart) {
      slotMap.set(`${s.slot}-${s.day_of_week}`, s);
    }
  });

  const getOrVirtual = (slotType: 'morning' | 'evening', dow: number): FeedingSlotWithDetails => {
    const existing = slotMap.get(`${slotType}-${dow}`);
    if (existing) return existing;

    return {
      id: undefined as any, // Important: don't send empty string
      pet_id: petId!,
      week_start: weekStart,
      day_of_week: dow,
      slot: slotType,
      assigned_to: null,
      assigned_at: null,
      fed_at: null,
      fed_by: null,
      home_id: null,
    };
  };

  const renderCell = (slotType: 'morning' | 'evening', dow: number) => {
    const slot = getOrVirtual(slotType, dow);
    const overdue = isSlotOverdue(slot);
    const now = isSlotNow(slot);
    const isMine = currentUser && slot.assigned_to === currentUser.id;
    const isReplacement = !!(slot.fed_at && slot.assigned_to && slot.fed_by !== slot.assigned_to);
    const member = slot.assigned_member ?? slot.fed_member ?? null;

    let cellClass =
      'relative flex flex-col items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer p-1.5 min-h-[64px] ';

    if (slot.fed_at) {
      if (isReplacement) {
        cellClass += 'bg-amber-50 dark:bg-amber-900/15 border-amber-300 dark:border-amber-700/40 ';
      } else {
        cellClass += 'bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-800/40 ';
      }
    } else if (overdue) {
      cellClass += 'bg-red-50 dark:bg-red-900/15 border-red-300 dark:border-red-700/40 animate-pulse ';
    } else if (now) {
      cellClass += 'bg-cyan-50 dark:bg-cyan-900/15 border-cyan-300 dark:border-cyan-500/40 animate-pulse ';
    } else if (slot.assigned_to) {
      cellClass += 'bg-white dark:bg-[#303030] border-[#E5E6E6] dark:border-[#3D3D3D] hover:bg-[#FAFAFA] dark:hover:bg-[#3A3A3A] ';
    } else {
      cellClass += 'bg-white dark:bg-[#303030] border-dashed border-[#E5E6E6] dark:border-[#3D3D3D] hover:bg-[#FAFAFA] dark:hover:bg-[#3A3A3A] ';
    }

    if (isMine && !slot.fed_at) {
      cellClass += 'ring-2 ring-[#3584E4] ring-offset-1 ';
    }

    return (
      <button
        key={`${slotType}-${dow}`}
        className={cellClass}
        onClick={() => onOpenModal(slot)}
      >
        {/* Status icon overlay */}
        {slot.fed_at ? (
          <CheckCircle2 className={`absolute top-1 right-1 w-3 h-3 ${isReplacement ? 'text-amber-500' : 'text-green-500'}`} />
        ) : overdue ? (
          <AlertTriangle className="absolute top-1 right-1 w-3 h-3 text-red-500" />
        ) : now ? (
          <Clock className="absolute top-1 right-1 w-3 h-3 text-cyan-600 dark:text-cyan-400" />
        ) : null}

        {/* Avatar or empty state */}
        {member ? (
          <>
            <Avatar member={member} className="w-7 h-7 text-xs" />
            <span className="text-[9px] font-medium text-[#1E1E1E] dark:text-white mt-1 leading-none text-center max-w-full truncate px-0.5">
              {isMine ? 'Tú' : member.name.split(' ')[0]}
            </span>
          </>
        ) : (
          <Plus className="w-4 h-4 text-[#1E1E1E]/20 dark:text-white/20" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {/* Weekly assignment summary */}
      {currentUser && countMap[currentUser.id] !== undefined && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-[#1E1E1E]/50 dark:text-white/50">
            Tus turnos esta semana
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            countMap[currentUser.id] >= 2
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          }`}>
            {countMap[currentUser.id]} / semana {countMap[currentUser.id] < 2 ? '(mín. 2 recomendado)' : '✓'}
          </span>
        </div>
      )}

      {/* Grid */}
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className="min-w-[340px]">
          {/* Day headers */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 mb-1">
            <div /> {/* empty corner */}
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-[#1E1E1E]/50 dark:text-white/50 py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Morning row */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 mb-1">
            <div className="flex items-center justify-end pr-1.5">
              <span className="text-[10px] font-semibold text-[#1E1E1E]/40 dark:text-white/40 text-right leading-tight">
                ☀️<br />
                <span className="text-[8px]">mañ.</span>
              </span>
            </div>
            {Array.from({ length: DAYS }, (_, i) => renderCell('morning', i))}
          </div>

          {/* Evening row */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-1">
            <div className="flex items-center justify-end pr-1.5">
              <span className="text-[10px] font-semibold text-[#1E1E1E]/40 dark:text-white/40 text-right leading-tight">
                🌙<br />
                <span className="text-[8px]">tarde</span>
              </span>
            </div>
            {Array.from({ length: DAYS }, (_, i) => renderCell('evening', i))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-1 pt-1">
        {[
          { color: 'bg-green-500', label: 'Alimentado' },
          { color: 'bg-amber-500', label: 'Reemplazo' },
          { color: 'bg-cyan-500 animate-pulse', label: 'Ahora' },
          { color: 'bg-red-500 animate-pulse', label: 'Atrasado' },
          { color: 'ring-2 ring-[#3584E4]', label: 'Tuyo' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#1E1E1E]/40 dark:text-white/40">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
