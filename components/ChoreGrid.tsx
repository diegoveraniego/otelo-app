'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Chore } from '@/lib/types';
import ConfirmChoreModal from './ConfirmChoreModal';
import { useUserStore } from '@/lib/store';

export default function ChoreGrid() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const { currentUser } = useUserStore();

  useEffect(() => {
    const fetchChores = async () => {
      const { data } = await supabase.from('chores').select('*').order('name');
      if (data) setChores(data);
    };
    fetchChores();
  }, []);

  const handleChoreClick = (chore: Chore) => {
    if (!currentUser) {
      window.dispatchEvent(new CustomEvent('open-user-modal'));
      return;
    }
    setSelectedChore(chore);
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-[#1E1E1E] dark:text-white mb-4 px-1">Registrar Tarea</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {chores.map((chore) => (
          <button
            key={chore.id}
            onClick={() => handleChoreClick(chore)}
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#303030] rounded-xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] hover:bg-[#FAFAFA] dark:hover:bg-[#3D3D3D] transition-colors aspect-square"
          >
            <span className="text-4xl mb-3">{chore.emoji}</span>
            <span className="text-sm font-medium text-[#1E1E1E] dark:text-white text-center leading-tight">
              {chore.name}
            </span>
          </button>
        ))}
      </div>

      <ConfirmChoreModal 
        chore={selectedChore} 
        isOpen={!!selectedChore} 
        onClose={() => setSelectedChore(null)} 
      />
    </div>
  );
}
