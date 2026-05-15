'use client';

import { FeedingSlotWithDetails } from '@/lib/types';
import { useUserStore } from '@/lib/store';
import Avatar from './Avatar';
import {
  SLOT_LABELS, isSlotOverdue, isSlotNow,
  getTodayDayOfWeek, getCurrentSlot
} from '@/lib/feedingUtils';
import { CheckCircle2, AlertTriangle, Clock, Plus } from 'lucide-react';

type Props = {
  slot: FeedingSlotWithDetails | undefined;
  onOpenModal: (slot: FeedingSlotWithDetails) => void;
};

export default function FeedingTodayCard({ slot, onOpenModal }: Props) {
  const { currentUser } = useUserStore();
  const slotType = slot?.slot ?? 'morning';
  const label = SLOT_LABELS[slotType];
  const emoji = slotType === 'morning' ? '🌅' : '🌆';
  const isNow = slot ? isSlotNow(slot) : false;
  const overdue = slot ? isSlotOverdue(slot) : false;
  const isMine = currentUser && slot?.assigned_to === currentUser.id;

  // Status styling
  const getCardStyle = () => {
    if (!slot || slot.fed_at) return '';
    if (overdue) return 'ring-2 ring-red-400 dark:ring-red-500';
    if (isNow) return 'ring-2 ring-blue-400 dark:ring-blue-500';
    return '';
  };

  const handleClick = () => {
    if (slot) {
      onOpenModal(slot);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative flex-1 min-w-0 flex flex-col items-center justify-between p-4 bg-white dark:bg-[#303030] rounded-2xl border border-[#E5E6E6] dark:border-[#3D3D3D] shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200 text-left ${getCardStyle()}`}
    >
      {/* Status badge */}
      {slot?.fed_at ? (
        <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[10px] font-bold">
          <CheckCircle2 className="w-3 h-3" /> Listo
        </span>
      ) : overdue ? (
        <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-[10px] font-bold animate-pulse">
          <AlertTriangle className="w-3 h-3" /> Atrasado
        </span>
      ) : isNow ? (
        <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">
          <Clock className="w-3 h-3" /> Ahora
        </span>
      ) : null}

      {/* Emoji + label */}
      <div className="flex flex-col items-center gap-1 mb-3 mt-1">
        <span className="text-3xl group-hover:scale-110 transition-transform">{emoji}</span>
        <span className="text-xs font-semibold text-[#1E1E1E]/60 dark:text-white/50 uppercase tracking-wider">{label}</span>
      </div>

      {/* Assigned person or empty state */}
      <div className="w-full">
        {slot?.fed_at ? (
          <div className="flex flex-col items-center gap-1">
            {slot.fed_member && <Avatar member={slot.fed_member} className="w-9 h-9 text-sm" />}
            <span className="text-xs font-medium text-green-600 dark:text-green-400 text-center leading-tight">
              {slot.fed_member?.name ?? '—'}
            </span>
          </div>
        ) : slot?.assigned_to && slot.assigned_member ? (
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <Avatar member={slot.assigned_member} className="w-9 h-9 text-sm" />
              {isMine && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#3584E4] rounded-full border-2 border-white dark:border-[#303030]" />
              )}
            </div>
            <span className="text-xs font-medium text-[#1E1E1E] dark:text-white text-center leading-tight">
              {isMine ? 'Tú' : slot.assigned_member.name}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-full border-2 border-dashed border-[#E5E6E6] dark:border-[#3D3D3D] flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#1E1E1E]/30 dark:text-white/30" />
            </div>
            <span className="text-[10px] text-[#1E1E1E]/40 dark:text-white/40">Sin encargado</span>
          </div>
        )}
      </div>
    </button>
  );
}
