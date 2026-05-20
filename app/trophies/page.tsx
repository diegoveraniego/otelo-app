'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUserStore } from '@/lib/store';
import { achievementService } from '@/lib/services/achievementService';
import { ACHIEVEMENTS, Achievement } from '@/lib/achievements/data';
import { Trophy, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TrophiesPage() {
  const { currentUser } = useUserStore();
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [unlockDates, setUnlockDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.id) {
      loadAchievements();
    }
  }, [currentUser]);

  const loadAchievements = async () => {
    if (!currentUser?.id || !currentUser?.home_id) return;
    try {
      // Intentionally evaluate so any retro-active achievements are unlocked
      await achievementService.evaluateAndUnlock(currentUser.id, currentUser.home_id);
      
      const data = await achievementService.getUnlockedAchievements(currentUser.id);
      const ids = new Set(data?.map(a => a.achievement_id) || []);
      const dates: Record<string, string> = {};
      data?.forEach(a => {
        dates[a.achievement_id] = a.unlocked_at;
      });
      setUnlockedIds(ids);
      setUnlockDates(dates);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = ['volumen', 'rachas', 'mascotas', 'cocina', 'limpieza', 'horarios', 'variedad', 'especiales'] as const;
    const catLabels: Record<string, string> = {
      volumen: 'Hitos Totales',
      rachas: 'Rachas de Días',
      mascotas: 'Cuidado de Mascotas',
      cocina: 'Cocina',
      limpieza: 'Limpieza',
      horarios: 'Horarios Especiales',
      variedad: 'Variedad de Tareas',
      especiales: 'Trofeos Especiales'
    };
    return cats.map(c => ({
      id: c,
      label: catLabels[c],
      achievements: ACHIEVEMENTS.filter(a => a.category === c)
    }));
  }, []);

  const totalUnlocked = unlockedIds.size;
  const totalAvailable = ACHIEVEMENTS.length;
  const pct = Math.round((totalUnlocked / totalAvailable) * 100) || 0;

  if (!currentUser) return null;

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E1E1E] dark:text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" /> Vitrina de Trofeos
        </h1>
        <p className="text-sm text-[#1E1E1E]/60 dark:text-white/60 mt-1">
          {currentUser.name}, has desbloqueado {totalUnlocked} de {totalAvailable} trofeos.
        </p>

        {/* Progress bar */}
        <div className="mt-4 bg-white dark:bg-[#303030] rounded-xl p-4 shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D]">
          <div className="flex justify-between items-center text-xs font-bold mb-2 text-[#1E1E1E] dark:text-white">
            <span>Progreso General</span>
            <span>{pct}%</span>
          </div>
          <div className="h-3 w-full bg-[#E5E6E6] dark:bg-[#2A2A2A] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-1000 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10 opacity-50">Cargando trofeos...</div>
      ) : (
        <div className="space-y-8">
          {categories.map(cat => {
            const catUnlocked = cat.achievements.filter(a => unlockedIds.has(a.id)).length;
            if (cat.achievements.length === 0) return null;

            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-sm font-bold text-[#1E1E1E] dark:text-white uppercase tracking-wider">{cat.label}</h2>
                  <span className="text-xs font-medium text-[#1E1E1E]/50 dark:text-white/50">{catUnlocked} / {cat.achievements.length}</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {cat.achievements.map(ach => {
                    const isUnlocked = unlockedIds.has(ach.id);
                    const unlockDate = unlockDates[ach.id];

                    return (
                      <div 
                        key={ach.id} 
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center gap-2 ${
                          isUnlocked 
                            ? 'bg-white dark:bg-[#303030] border-yellow-200 dark:border-yellow-900/50 shadow-sm hover:scale-105'
                            : 'bg-[#FAFAFA] dark:bg-[#242424] border-[#E5E6E6] dark:border-[#3D3D3D] opacity-60 grayscale'
                        }`}
                      >
                        <div className="text-4xl relative">
                          {isUnlocked ? ach.emoji : '❓'}
                          {!isUnlocked && (
                            <div className="absolute -bottom-1 -right-1 bg-neutral-200 dark:bg-neutral-800 rounded-full p-1 border border-white dark:border-[#3D3D3D]">
                              <Lock className="w-3 h-3 text-neutral-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 w-full">
                          <h3 className="text-xs font-bold text-[#1E1E1E] dark:text-white line-clamp-2 leading-tight">
                            {isUnlocked ? ach.name : 'Bloqueado'}
                          </h3>
                          <p className="text-[10px] text-[#1E1E1E]/60 dark:text-white/60 mt-1 line-clamp-3 leading-snug">
                            {ach.description}
                          </p>
                        </div>
                        {isUnlocked && unlockDate && (
                          <div className="text-[9px] font-medium text-amber-600 dark:text-amber-500 mt-1">
                            {format(new Date(unlockDate), "d 'de' MMM", { locale: es })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
