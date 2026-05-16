'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { feedingService } from '@/lib/services/feedingService';
import { FeedingSlotWithDetails, Member, Pet } from '@/lib/types';
import {
  getWeekStart, getTodayDayOfWeek, DAY_NAMES_FULL, isSlotOverdue
} from '@/lib/feedingUtils';
import FeedingTodayCard from '@/components/FeedingTodayCard';
import FeedingWeekGrid from '@/components/FeedingWeekGrid';
import FeedingSlotModal from '@/components/FeedingSlotModal';
import { CalendarDays, AlertCircle, ChevronLeft, ChevronRight, PawPrint } from 'lucide-react';
import { addWeeks, format } from 'date-fns';
import { es } from 'date-fns/locale';

const MAX_WEEKS_AHEAD = 8;
const MAX_WEEKS_BACK = 12;

function getOffsetWeekStart(offset: number): string {
  const base = addWeeks(new Date(), offset);
  return getWeekStart(base);
}

function weekLabel(weekStart: string, offset: number): string {
  if (offset === 0) return 'Esta semana';
  if (offset === 1) return 'Próxima semana';
  const date = new Date(weekStart + 'T12:00:00');
  return `Semana del ${format(date, "d 'de' MMMM", { locale: es })}`;
}

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [slots, setSlots] = useState<FeedingSlotWithDetails[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<FeedingSlotWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const todayDow = getTodayDayOfWeek();
  const todayName = DAY_NAMES_FULL[todayDow];
  const currentWeekStart = getWeekStart();
  const viewedWeekStart = getOffsetWeekStart(weekOffset);
  const isCurrentWeek = weekOffset === 0;

  const { currentUser } = useUserStore();

  // Cache pets on mount
  useEffect(() => {
    if (!currentUser?.home_id) return;
    
    feedingService.getPets(currentUser.home_id).then(data => {
      if (data && data.length > 0) {
        setPets(data);
        if (!selectedPetId) setSelectedPetId(data[0].id);
      }
    }).catch(console.error)
      .finally(() => {
        if (pets.length === 0) setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.home_id]);

  const fetchData = useCallback(async () => {
    if (!selectedPetId) return;
    setSlots([]); // Clear stale data immediately
    setIsLoading(true);
    try {
      const data = await feedingService.getWeeklySlots(viewedWeekStart, selectedPetId);
      setSlots(data);
    } catch (err) {
      console.error('Error fetching weekly slots:', err);
    } finally {
      setIsLoading(false);
    }
  }, [viewedWeekStart, selectedPetId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Performance: Memoize today's slots to avoid re-calculating on every render
  const { todayMorning, todayEvening } = useMemo(() => {
    if (!isCurrentWeek) return { todayMorning: undefined, todayEvening: undefined };
    return {
      todayMorning: slots.find((s) => s.day_of_week === todayDow && s.slot === 'morning'),
      todayEvening: slots.find((s) => s.day_of_week === todayDow && s.slot === 'evening')
    };
  }, [slots, isCurrentWeek, todayDow]);

  const overdueToday = useMemo(() =>
    [todayMorning, todayEvening].filter(
      (s): s is FeedingSlotWithDetails => !!s && !s.fed_at && isSlotOverdue(s)
    ), [todayMorning, todayEvening]
  );

  const selectedPet = useMemo(() => pets.find(p => p.id === selectedPetId), [pets, selectedPetId]);

  const openModal = useCallback((slot: FeedingSlotWithDetails) => {
    if (!slot.pet_id && selectedPetId) {
      slot.pet_id = selectedPetId;
    }
    setSelectedSlot(slot);
  }, [selectedPetId]);

  if (pets.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
        <PawPrint className="w-16 h-16 text-[#E5E6E6] dark:text-[#3D3D3D]" />
        <div>
          <h2 className="text-xl font-bold text-[#1E1E1E] dark:text-white">No hay mascotas</h2>
          <p className="text-sm text-[#1E1E1E]/50 dark:text-white/50">Configura tus mascotas para empezar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-8 space-y-6 mt-2">
      {/* Page header & Pet Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🐾</span>
          <div>
            <h2 className="text-xl font-bold text-[#1E1E1E] dark:text-white" style={{ fontFamily: 'var(--font-bagnard)' }}>
              Comida de {selectedPet?.name || 'Mascotas'}
            </h2>
            <p className="text-xs text-[#1E1E1E]/50 dark:text-white/50">
              Coordinación de turnos
            </p>
          </div>
        </div>

        {pets.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {pets.map(pet => (
              <button
                key={pet.id}
                onClick={() => {
                  setSlots([]); // Clear slots to show loading state
                  setSelectedPetId(pet.id);
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${selectedPetId === pet.id
                    ? 'bg-[#3584E4] text-white border-[#3584E4] shadow-sm'
                    : 'bg-white dark:bg-[#303030] text-[#1E1E1E]/60 dark:text-white/60 border-[#E5E6E6] dark:border-[#3D3D3D] hover:border-[#3584E4]'
                  }`}
              >
                {pet.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alert banner */}
      {isCurrentWeek && overdueToday.length > 0 && (
        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              ¡{selectedPet?.name} aún no ha comido!
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">
              {overdueToday.length === 2
                ? 'Ni el turno de mañana ni el de tarde se han registrado.'
                : `El turno de ${overdueToday[0]?.slot === 'morning' ? 'mañana' : 'tarde'} está atrasado.`}
            </p>
          </div>
        </div>
      )}

      {/* TODAY section */}
      {isCurrentWeek && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[#1E1E1E]/50 dark:text-white/50 flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3584E4]" />
            Hoy — {todayName}
          </h3>

          {isLoading ? (
            <div className="flex gap-3">
              <div className="flex-1 h-36 rounded-2xl bg-[#E5E6E6] dark:bg-[#3D3D3D] animate-pulse" />
              <div className="flex-1 h-36 rounded-2xl bg-[#E5E6E6] dark:bg-[#3D3D3D] animate-pulse" />
            </div>
          ) : (
            <div className="flex gap-3">
              <FeedingTodayCard
                slot={todayMorning ?? {
                  id: undefined as any, pet_id: selectedPetId!, week_start: currentWeekStart, day_of_week: todayDow, slot: 'morning',
                  assigned_to: null, assigned_at: null, fed_at: null, fed_by: null, home_id: null,
                }}
                onOpenModal={openModal}
              />
              <FeedingTodayCard
                slot={todayEvening ?? {
                  id: undefined as any, pet_id: selectedPetId!, week_start: currentWeekStart, day_of_week: todayDow, slot: 'evening',
                  assigned_to: null, assigned_at: null, fed_at: null, fed_by: null, home_id: null,
                }}
                onOpenModal={openModal}
              />
            </div>
          )}
        </section>
      )}

      {/* WEEK GRID section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-[#1E1E1E]/50 dark:text-white/50 flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5" />
            {weekLabel(viewedWeekStart, weekOffset)}
          </h3>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setSlots([]);
                setWeekOffset((w) => Math.max(-MAX_WEEKS_BACK, w - 1));
              }}
              disabled={weekOffset <= -MAX_WEEKS_BACK}
              className="p-1.5 rounded-lg text-[#1E1E1E]/50 dark:text-white/50 hover:bg-[#E5E6E6] dark:hover:bg-[#3D3D3D] disabled:opacity-20 transition-colors"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {weekOffset > 0 && (
              <button
                onClick={() => {
                  setSlots([]);
                  setWeekOffset(0);
                }}
                className="text-[10px] font-semibold px-2 py-0.5 bg-[#3584E4]/10 text-[#3584E4] rounded-full hover:bg-[#3584E4]/20 transition-colors"
              >
                Hoy
              </button>
            )}

            <button
              onClick={() => {
                setSlots([]);
                setWeekOffset((w) => Math.min(MAX_WEEKS_AHEAD, w + 1));
              }}
              disabled={weekOffset >= MAX_WEEKS_AHEAD}
              className="p-1.5 rounded-lg text-[#1E1E1E]/50 dark:text-white/50 hover:bg-[#E5E6E6] dark:hover:bg-[#3D3D3D] disabled:opacity-20 transition-colors"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading && slots.length === 0 ? (
          <div className="h-40 rounded-2xl bg-[#E5E6E6] dark:bg-[#3D3D3D] animate-pulse" />
        ) : (
          <div className="bg-white dark:bg-[#303030] rounded-2xl border border-[#E5E6E6] dark:border-[#3D3D3D] p-4 shadow-sm transition-opacity duration-200">
            <FeedingWeekGrid
              slots={slots}
              weekStart={viewedWeekStart}
              petId={selectedPetId || undefined}
              onOpenModal={openModal}
            />
          </div>
        )}
      </section>

      <FeedingSlotModal
        slot={selectedSlot}
        isOpen={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        onRefresh={fetchData}
      />
    </div>
  );
}
