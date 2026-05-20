'use client';

import { useEffect, useState } from 'react';
import { Achievement } from '@/lib/achievements/data';
import { Trophy } from 'lucide-react';

export default function AchievementToast() {
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);

  useEffect(() => {
    const handleUnlocked = (e: CustomEvent<Achievement[]>) => {
      setQueue(prev => [...prev, ...e.detail]);
    };

    window.addEventListener('achievements-unlocked', handleUnlocked as EventListener);
    return () => window.removeEventListener('achievements-unlocked', handleUnlocked as EventListener);
  }, []);

  useEffect(() => {
    if (queue.length > 0 && !current) {
      setCurrent(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [queue, current]);

  useEffect(() => {
    if (current) {
      const timer = setTimeout(() => {
        setCurrent(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [current]);

  if (!current) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] pointer-events-none flex justify-center">
      <div className="bg-white dark:bg-[#303030] border-2 border-yellow-400 rounded-2xl shadow-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-10 fade-in duration-500 max-w-sm w-full">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full relative shrink-0">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
            {current.emoji}
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-[10px] font-black uppercase text-yellow-500 tracking-wider">¡Nuevo Trofeo!</h4>
          <p className="text-sm font-bold text-[#1E1E1E] dark:text-white leading-tight mt-0.5">{current.name}</p>
          <p className="text-xs text-[#1E1E1E]/60 dark:text-white/60 mt-0.5 leading-snug">{current.description}</p>
        </div>
      </div>
    </div>
  );
}
