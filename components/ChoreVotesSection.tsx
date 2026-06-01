'use client';

import { useState, useEffect, useCallback } from 'react';
import { choreVoteService } from '@/lib/services/choreVoteService';
import { choreService } from '@/lib/services/choreService';
import { Chore, ChoreVote } from '@/lib/types';
import { useUserStore } from '@/lib/store';
import { Star, Target } from 'lucide-react';

export default function ChoreVotesSection() {
  const { currentUser } = useUserStore();
  const [chores, setChores] = useState<Chore[]>([]);
  const [votes, setVotes] = useState<ChoreVote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentUser?.home_id) return;
    setIsLoading(true);
    try {
      const [choreData, voteData] = await Promise.all([
        choreService.getChores(currentUser.home_id),
        choreVoteService.getVotes(currentUser.home_id)
      ]);
      setChores(choreData);
      setVotes(voteData);
    } catch (err) {
      console.error('Error fetching data for votes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.home_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVote = async (choreId: string, points: number) => {
    if (!currentUser?.home_id) return;
    try {
      await choreVoteService.vote(choreId, currentUser.id, currentUser.home_id, points);
      await fetchData();
    } catch (err) {
      console.error('Error casting vote:', err);
      alert('Hubo un error al guardar tu voto.');
    }
  };

  if (!currentUser?.home_id) return null;

  return (
    <div className="mt-8 mb-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg font-bold text-[#1E1E1E] dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-[#3584E4]" />
          Valor de Tareas
        </h2>
      </div>

      <div className="bg-white dark:bg-[#303030] p-6 rounded-3xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D]">
        <p className="text-sm text-[#1E1E1E]/60 dark:text-white/60 mb-6">
          Vota la dificultad o el esfuerzo de cada tarea (1: Muy fácil, 2: Fácil, 3: Neutral, 4: Difícil, 5: Muy difícil). El valor final se promediará cuando 5 personas hayan votado.
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-[#F5F5F7] dark:bg-[#2A2A2A] animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {chores.map(chore => {
              const choreVotes = votes.filter(v => v.chore_id === chore.id);
              const userVote = choreVotes.find(v => v.member_id === currentUser?.id)?.points;
              
              return (
                <div key={chore.id} className="bg-[#F5F5F7] dark:bg-[#2A2A2A] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl bg-white dark:bg-[#303030] w-12 h-12 rounded-xl flex items-center justify-center border border-[#E5E6E6] dark:border-[#3D3D3D] shadow-sm">
                      {chore.emoji}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1E1E1E] dark:text-white">{chore.name}</h4>
                      <div className="text-xs font-medium text-[#1E1E1E]/50 dark:text-white/50 mt-1 flex gap-2">
                        <span>Valor actual: {chore.points || 1} pts</span>
                        <span>•</span>
                        <span>Votos: {choreVotes.length}/5</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex bg-white dark:bg-[#303030] rounded-xl border border-[#E5E6E6] dark:border-[#3D3D3D] p-1 shadow-sm w-fit">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleVote(chore.id, val)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                          userVote === val 
                            ? 'bg-[#3584E4] text-white shadow-sm' 
                            : 'text-[#1E1E1E]/40 dark:text-white/40 hover:bg-[#F5F5F7] dark:hover:bg-[#3D3D3D]'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
