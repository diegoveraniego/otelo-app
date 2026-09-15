'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { Flag, Check, X as XIcon, Clock, AlertTriangle } from 'lucide-react';

export default function DisputesPage() {
  const { currentUser } = useUserStore();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDisputes = async () => {
    if (!currentUser?.home_id) return;
    
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          log:logs(
            *,
            chore:chores(*),
            member:members(*)
          ),
          disputer:members!disputed_by(*)
        `)
        .eq('home_id', currentUser.home_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (err) {
      console.error('Error fetching disputes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [currentUser?.home_id]);

  const handleVote = async (dispute: any, vote: 'accept' | 'reject') => {
    if (!currentUser) return;
    
    const newVotes = { ...dispute.votes, [currentUser.id]: vote };
    const voteKeys = Object.keys(newVotes);
    
    let newStatus = dispute.status;
    
    if (voteKeys.length >= 4) {
      const accepts = Object.values(newVotes).filter(v => v === 'accept').length;
      newStatus = accepts >= (voteKeys.length / 2) ? 'resolved_accepted' : 'resolved_rejected';
    }

    try {
      const { error: updateError } = await supabase
        .from('disputes')
        .update({ 
          votes: newVotes,
          status: newStatus
        })
        .eq('id', dispute.id);

      if (updateError) throw updateError;

      if (newStatus === 'resolved_accepted') {
        const { error: logError } = await supabase
          .from('logs')
          .insert({
            home_id: currentUser.home_id,
            member_id: dispute.log.member_id,
            chore_id: null,
            points: -dispute.log.chore.points,
            metadata: { reason: "Dispute lost" }
          });
          
        if (logError) throw logError;
      }

      fetchDisputes();
    } catch (err) {
      console.error('Error voting:', err);
      alert('Error al procesar el voto');
    }
  };

  if (!currentUser) return null;

  return (
    <div className="animate-in fade-in duration-500 pb-24 mt-2 px-2 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500">
          <Flag className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] dark:text-white">Disputas</h1>
          <p className="text-sm text-[#1E1E1E]/60 dark:text-white/60">
            Tribunal del hogar. Vota para resolver conflictos de tareas.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <span className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-[#1E1E1E]/50 dark:text-white/40 bg-white dark:bg-[#1A1A1E] rounded-3xl border border-[#E5E6E6] dark:border-[#2C2C30]">
          <Check className="w-12 h-12 mb-3 text-green-500" />
          <p className="text-sm font-semibold">No hay disputas activas</p>
          <p className="text-xs mt-1">El hogar está en paz.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const isPending = dispute.status === 'pending';
            const totalVotes = Object.keys(dispute.votes || {}).length;
            const canVote = isPending && 
                            currentUser.id !== dispute.log.member_id && 
                            currentUser.id !== dispute.disputed_by && 
                            !(dispute.votes || {})[currentUser.id];

            return (
              <div key={dispute.id} className="bg-white dark:bg-[#1A1A1E] rounded-3xl p-5 border border-[#E5E6E6] dark:border-[#2C2C30] shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-[#1E1E1E] dark:text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Disputa contra {dispute.log.member.name}
                    </h3>
                    <p className="text-xs text-[#1E1E1E]/60 dark:text-white/60 mt-1">
                      Iniciada por {dispute.disputer?.name || 'Alguien'} • Tarea: {dispute.log.chore.name}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    isPending ? 'bg-amber-500/10 text-amber-600' :
                    dispute.status === 'resolved_accepted' ? 'bg-red-500/10 text-red-600' :
                    'bg-green-500/10 text-green-600'
                  }`}>
                    {isPending ? 'PENDIENTE' : dispute.status === 'resolved_accepted' ? 'ACEPTADA' : 'RECHAZADA'}
                  </div>
                </div>

                <div className="bg-[#FAFAFA] dark:bg-[#252525] p-3 rounded-xl mb-4 border border-[#E5E6E6] dark:border-[#404040]">
                  <p className="text-sm text-[#1E1E1E] dark:text-white italic">
                    "{dispute.reason}"
                  </p>
                </div>

                {isPending && (
                  <div className="flex items-center justify-between mt-4 border-t border-[#E5E6E6] dark:border-[#2C2C30] pt-4">
                    <div className="text-xs font-semibold text-[#1E1E1E]/60 dark:text-white/60 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Votos: {totalVotes} / 4
                    </div>
                    {canVote ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVote(dispute, 'reject')}
                          className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#2C2C30] dark:hover:bg-[#353535] text-neutral-600 dark:text-neutral-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                        >
                          <XIcon className="w-3.5 h-3.5" /> Rechazar
                        </button>
                        <button
                          onClick={() => handleVote(dispute, 'accept')}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-red-500/20 flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Aceptar Disputa
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-400 font-medium">
                        {currentUser.id === dispute.log.member_id ? "No puedes votar en tu propia disputa" :
                         currentUser.id === dispute.disputed_by ? "No puedes votar en una disputa que iniciaste" :
                         (dispute.votes || {})[currentUser.id] ? "Ya votaste" : ""}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
