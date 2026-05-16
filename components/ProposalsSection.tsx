'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { proposalService } from '@/lib/services/proposalService';
import { choreService } from '@/lib/services/choreService';
import { supabase } from '@/lib/supabase/client'; // Still needed for member count or can move to service
import { Proposal, Member, Chore } from '@/lib/types';
import { useUserStore } from '@/lib/store';
import { Plus, MessageSquare, ThumbsUp, Clock, Tag, Smile, X } from 'lucide-react';
import Avatar from './Avatar';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import { feedingService } from '@/lib/services/feedingService';
import { differenceInDays, addDays, isBefore } from 'date-fns';

export default function ProposalsSection() {
  const { currentUser } = useUserStore();
  const { resolvedTheme } = useTheme();
  
  const [proposals, setProposals] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [existingEmojis, setExistingEmojis] = useState<string[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    emoji: '',
    category: '',
    newCategory: '',
    threshold: '3'
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Parallel fetch for base data
      const [allMembers, choreData] = await Promise.all([
        feedingService.getMembers(),
        choreService.getChores()
      ]);
      
      setMembersCount(allMembers.length);
      if (choreData) {
        setExistingEmojis(choreData.map(c => c.emoji));
        setCategories(Array.from(new Set(choreData.map(c => c.category).filter(Boolean))));
      }

      // 2. Fetch active proposals and their votes
      const props = await proposalService.getActiveProposals();
      const allVotes = await proposalService.getVotes(props.map(p => p.id));
      
      // 3. Auto-process: Check for approvals or expirations
      let needsRefresh = false;
      for (const prop of props) {
        const propVotes = allVotes.filter(v => v.proposal_id === prop.id);
        const deadline = addDays(new Date(prop.created_at), prop.threshold_days);
        const isExpired = isBefore(deadline, new Date());

        if (propVotes.length >= allMembers.length) {
          await proposalService.approveProposal(prop);
          needsRefresh = true;
        } else if (isExpired) {
          await proposalService.rejectProposal(prop.id);
          needsRefresh = true;
        }
      }

      // 4. Final state update
      if (needsRefresh) {
        const updatedProps = await proposalService.getActiveProposals();
        const updatedVotes = await proposalService.getVotes(updatedProps.map(p => p.id));
        setProposals(updatedProps);
        setVotes(updatedVotes);
      } else {
        setProposals(props);
        setVotes(allVotes);
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener('chore-logged', fetchData);
    return () => window.removeEventListener('chore-logged', fetchData);
  }, [fetchData]);

  const handleVote = async (proposalId: string) => {
    if (!currentUser) {
      window.dispatchEvent(new CustomEvent('open-user-modal'));
      return;
    }
    
    try {
      await proposalService.toggleVote(proposalId, currentUser.id, currentUser.home_id);
      
      // Refresh to check for approval
      fetchData();
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isSubmitting) return;
    setError('');

    const { name, emoji, category, newCategory, threshold } = formData;

    if (!name || !emoji || (!category && !newCategory)) {
      setError('Completa todos los campos');
      return;
    }

    if (existingEmojis.includes(emoji)) {
      setError('Este emoji ya está en uso');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalCategory = category === 'new' ? newCategory : category;
      await proposalService.createProposal({
        name,
        emoji,
        category: finalCategory,
        threshold_days: parseInt(threshold),
        created_by: currentUser.id
      });
      
      setFormData({ name: '', emoji: '', category: '', newCategory: '', threshold: '3' });
      setIsAdding(false);
      fetchData();
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-12 mb-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg font-bold text-[#1E1E1E] dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#3584E4]" />
          Consejo Familiar
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`text-sm font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            isAdding 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
              : 'bg-[#3584E4]/10 text-[#3584E4] hover:bg-[#3584E4]/20'
          }`}
        >
          {isAdding ? <><X className="w-4 h-4" /> Cancelar</> : <><Plus className="w-4 h-4" /> Proponer</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#303030] p-6 rounded-3xl shadow-xl border border-[#E5E6E6] dark:border-[#3D3D3D] mb-8 space-y-5 animate-in zoom-in-95 duration-200">
          <div className="grid grid-cols-[90px_1fr] gap-4">
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black uppercase text-[#1E1E1E]/30 dark:text-white/30 px-1 tracking-widest">Emoji</label>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full text-3xl bg-[#F5F5F7] dark:bg-[#242424] border border-[#E5E6E6] dark:border-[#3D3D3D] rounded-2xl h-14 flex items-center justify-center hover:scale-105 transition-transform shadow-sm"
              >
                {formData.emoji || <Smile className="w-7 h-7 text-[#1E1E1E]/10" />}
              </button>
              
              {showEmojiPicker && (
                <div className="absolute top-full left-0 z-[70] mt-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                  <div className="relative shadow-2xl rounded-3xl overflow-hidden border border-[#E5E6E6] dark:border-[#3D3D3D]">
                    <EmojiPicker 
                      onEmojiClick={(e) => {
                        setFormData(prev => ({ ...prev, emoji: e.emoji }));
                        setShowEmojiPicker(false);
                      }}
                      theme={resolvedTheme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                      width={320}
                      height={400}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#1E1E1E]/30 dark:text-white/30 px-1 tracking-widest">Nombre de la tarea</label>
              <input 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Limpiar el horno"
                className="w-full bg-[#F5F5F7] dark:bg-[#242424] border border-[#E5E6E6] dark:border-[#3D3D3D] rounded-2xl h-14 px-5 focus:outline-none focus:ring-2 focus:ring-[#3584E4] text-[#1E1E1E] dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#1E1E1E]/30 dark:text-white/30 px-1 tracking-widest">Categoría</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-[#F5F5F7] dark:bg-[#242424] border border-[#E5E6E6] dark:border-[#3D3D3D] rounded-2xl h-14 px-4 focus:outline-none focus:ring-2 focus:ring-[#3584E4] text-[#1E1E1E] dark:text-white font-medium"
              >
                <option value="">Seleccionar...</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                <option value="new">+ Nueva categoría</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#1E1E1E]/30 dark:text-white/30 px-1 tracking-widest">Frecuencia (días)</label>
              <input 
                type="number"
                value={formData.threshold}
                onChange={(e) => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                className="w-full bg-[#F5F5F7] dark:bg-[#242424] border border-[#E5E6E6] dark:border-[#3D3D3D] rounded-2xl h-14 px-5 focus:outline-none focus:ring-2 focus:ring-[#3584E4] text-[#1E1E1E] dark:text-white font-medium"
                min="1"
              />
            </div>
          </div>

          {formData.category === 'new' && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <label className="text-[10px] font-black uppercase text-[#1E1E1E]/30 dark:text-white/30 px-1 tracking-widest">Nueva categoría</label>
              <input 
                value={formData.newCategory}
                onChange={(e) => setFormData(prev => ({ ...prev, newCategory: e.target.value }))}
                placeholder="Ej: Mantenimiento"
                className="w-full bg-[#F5F5F7] dark:bg-[#242424] border border-[#E5E6E6] dark:border-[#3D3D3D] rounded-2xl h-14 px-5 focus:outline-none focus:ring-2 focus:ring-[#3584E4] text-[#1E1E1E] dark:text-white"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-500 px-1 font-medium">{error}</p>}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#3584E4] hover:bg-[#1C71D8] text-white h-14 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Enviando...' : 'Lanzar Propuesta'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {proposals.length === 0 && !isAdding && !isLoading && (
          <div className="bg-white dark:bg-[#303030] p-10 rounded-3xl border-2 border-dashed border-[#E5E6E6] dark:border-[#3D3D3D] text-center transition-colors">
            <p className="text-[#1E1E1E]/30 dark:text-white/30 text-sm font-medium">No hay propuestas activas ahora mismo.</p>
          </div>
        )}
        
        {proposals.map(proposal => {
          const propVotes = votes.filter(v => v.proposal_id === proposal.id);
          const hasVoted = votes.some(v => v.proposal_id === proposal.id && v.member_id === currentUser?.id);
          const daysLeft = 7 - differenceInDays(new Date(), new Date(proposal.created_at));
          
          return (
            <div key={proposal.id} className="bg-white dark:bg-[#303030] p-5 rounded-3xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] flex items-center gap-5 hover:border-[#3584E4]/30 transition-all group">
              <div className="text-3xl bg-[#F5F5F7] dark:bg-[#242424] w-16 h-16 rounded-2xl flex items-center justify-center border border-[#E5E6E6] dark:border-[#3D3D3D] group-hover:scale-105 transition-transform">
                {proposal.emoji || '📋'}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#1E1E1E] dark:text-white text-base truncate">{proposal.title || proposal.name}</h4>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] font-black text-[#1E1E1E]/30 dark:text-white/30 uppercase tracking-tighter">
                    <Tag className="w-3 h-3" />
                    {proposal.category || 'General'}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-black text-[#1E1E1E]/30 dark:text-white/30 uppercase tracking-tighter">
                    <Clock className="w-3 h-3" />
                    {daysLeft}d restantes
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <button 
                  onClick={() => handleVote(proposal.id)}
                  className={`p-3.5 rounded-2xl transition-all ${hasVoted ? 'bg-[#3584E4] text-white shadow-lg scale-110' : 'bg-[#F5F5F7] dark:bg-[#242424] text-[#1E1E1E]/30 dark:text-white/20 hover:text-[#3584E4] hover:bg-[#3584E4]/10'}`}
                >
                  <ThumbsUp className={`w-6 h-6 ${hasVoted ? 'fill-current' : ''}`} />
                </button>
                <div className="w-full bg-[#E5E6E6] dark:bg-[#3D3D3D] h-1 rounded-full overflow-hidden mt-1">
                   <div 
                    className="bg-[#3584E4] h-full transition-all duration-1000" 
                    style={{ width: `${(propVotes.length / membersCount) * 100}%` }}
                   />
                </div>
                <span className="text-[10px] font-black text-[#1E1E1E]/40 dark:text-white/40 tracking-widest">
                  {propVotes.length}/{membersCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
   </div>
  );
}
