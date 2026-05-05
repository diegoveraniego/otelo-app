'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Proposal, ProposalVote, Member, Chore } from '@/lib/types';
import { useUserStore } from '@/lib/store';
import { Plus, Check, MessageSquare, ThumbsUp, Clock, Tag, Smile } from 'lucide-react';
import Avatar from './Avatar';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';

export default function ProposalsSection() {
  const { currentUser } = useUserStore();
  const { resolvedTheme } = useTheme();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votes, setVotes] = useState<ProposalVote[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [existingEmojis, setExistingEmojis] = useState<string[]>([]);
  
  // Form state
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [threshold, setThreshold] = useState('3');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener('chore-logged', handleRefresh);
    return () => window.removeEventListener('chore-logged', handleRefresh);
  }, []);

  const fetchData = async () => {
    const [
      { data: propData }, 
      { data: voteData }, 
      { data: memData }, 
      { data: choreData }
    ] = await Promise.all([
      supabase.from('proposals').select('*').eq('status', 'pending'),
      supabase.from('proposal_votes').select('*'),
      supabase.from('members').select('id'),
      supabase.from('chores').select('emoji, category')
    ]);

    if (propData) setProposals(propData);
    if (voteData) setVotes(voteData);
    if (memData) setMembersCount(memData.length);
    if (choreData) {
      setExistingEmojis(choreData.map(c => c.emoji));
      const cats = Array.from(new Set(choreData.map(c => c.category).filter(Boolean)));
      setCategories(cats as string[]);
    }
  };

  const handleVote = async (proposalId: string) => {
    if (!currentUser) return;
    
    const hasVoted = votes.some(v => v.proposal_id === proposalId && v.member_id === currentUser.id);
    
    if (hasVoted) {
      // Remove vote
      await supabase.from('proposal_votes').delete().eq('proposal_id', proposalId).eq('member_id', currentUser.id);
    } else {
      // Add vote
      await supabase.from('proposal_votes').insert({
        proposal_id: proposalId,
        member_id: currentUser.id
      });
    }
    
    // Check if approved
    const proposalVotes = votes.filter(v => v.proposal_id === proposalId);
    const newVoteCount = hasVoted ? proposalVotes.length - 1 : proposalVotes.length + 1;
    
    if (newVoteCount >= membersCount && !hasVoted) {
      await approveProposal(proposals.find(p => p.id === proposalId)!);
    }
    
    fetchData();
  };

  const approveProposal = async (proposal: Proposal) => {
    // 1. Add to chores
    const { error: choreError } = await supabase.from('chores').insert({
      name: proposal.name,
      emoji: proposal.emoji,
      category: proposal.category,
      threshold_days: proposal.threshold_days
    });

    if (!choreError) {
      // 2. Mark proposal as approved
      await supabase.from('proposals').update({ status: 'approved' }).eq('id', proposal.id);
      window.dispatchEvent(new CustomEvent('chore-logged'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isSubmitting) return;
    setError('');

    if (!name || !emoji || (!category && !newCategory)) {
      setError('Completa todos los campos');
      return;
    }

    if (existingEmojis.includes(emoji)) {
      setError('Este emoji ya está en uso');
      return;
    }

    setIsSubmitting(true);
    const finalCategory = category === 'new' ? newCategory : category;

    const { error: submitError } = await supabase.from('proposals').insert({
      name,
      emoji,
      category: finalCategory,
      threshold_days: parseInt(threshold),
      created_by: currentUser.id,
      status: 'pending'
    });

    if (submitError) {
      setError('Error al enviar propuesta');
    } else {
      setName('');
      setEmoji('');
      setCategory('');
      setNewCategory('');
      setThreshold('3');
      setIsAdding(false);
      fetchData();
    }
    setIsSubmitting(false);
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
          className="text-sm font-medium text-[#3584E4] dark:text-[#62A0EA] hover:bg-[#3584E4]/10 dark:hover:bg-[#62A0EA]/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
        >
          {isAdding ? 'Cancelar' : <><Plus className="w-4 h-4" /> Proponer</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#303030] p-6 rounded-2xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] mb-6 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="grid grid-cols-[80px_1fr] gap-4">
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold uppercase text-[#1E1E1E]/40 dark:text-white/40 px-1">Emoji</label>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full text-2xl text-center bg-[#F5F5F7] dark:bg-[#242424] border border-[#E5E6E6] dark:border-[#3D3D3D] rounded-xl h-12 focus:outline-none focus:ring-2 focus:ring-[#3584E4] flex items-center justify-center hover:bg-[#E5E6E6] dark:hover:bg-[#333333] transition-colors"
              >
                {emoji || <Smile className="w-6 h-6 text-[#1E1E1E]/20 dark:text-white/20" />}
              </button>
              
              {showEmojiPicker && (
                <div className="absolute top-full left-0 z-50 mt-2">
                  <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                  <div className="relative shadow-2xl rounded-xl overflow-hidden border border-[#E5E6E6] dark:border-[#3D3D3D]">
                    <EmojiPicker 
                      onEmojiClick={(emojiData) => {
                        setEmoji(emojiData.emoji);
                        setShowEmojiPicker(false);
                      }}
                      theme={resolvedTheme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                      lazyLoadEmojis={true}
                      skinTonesDisabled={true}
                      searchPlaceHolder="Buscar..."
                      width={300}
                      height={400}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-[#1E1E1E]/40 dark:text-white/40 px-1">Nombre de la tarea</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Limpiar el horno"
                className="w-full bg-[#F5F5F7] dark:bg-[#242424] border border-[#E5E6E6] dark:border-[#3D3D3D] rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-[#3584E4] text-[#1E1E1E] dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-[#1E1E1E]/40 dark:text-white/40 px-1">Categoría</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F5F5F7] dark:bg-[#242424] border border-[#E5E6E6] dark:border-[#3D3D3D] rounded-xl h-12 px-3 focus:outline-none focus:ring-2 focus:ring-[#3584E4] text-[#1E1E1E] dark:text-white text-sm"
              >
                <option value="">Seleccionar...</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                <option value="new">+ Nueva categoría</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-[#1E1E1E]/40 dark:text-white/40 px-1">Frecuencia (días)</label>
              <input 
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full bg-[#F5F5F7] dark:bg-[#242424] border border-[#E5E6E6] dark:border-[#3D3D3D] rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-[#3584E4] text-[#1E1E1E] dark:text-white"
                min="1"
              />
            </div>
          </div>

          {category === 'new' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2">
              <label className="text-[10px] font-bold uppercase text-[#1E1E1E]/40 dark:text-white/40 px-1">Nombre de nueva categoría</label>
              <input 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ej: Mantenimiento"
                className="w-full bg-[#F5F5F7] dark:bg-[#242424] border border-[#E5E6E6] dark:border-[#3D3D3D] rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-[#3584E4] text-[#1E1E1E] dark:text-white"
              />
            </div>
          )}

          {error && <p className="text-xs text-[#E01B24] px-1">{error}</p>}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#3584E4] hover:bg-[#1C71D8] text-white h-12 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Enviando...' : 'Lanzar Propuesta'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {proposals.length === 0 && !isAdding && (
          <div className="bg-white dark:bg-[#303030] p-8 rounded-2xl border-2 border-dashed border-[#E5E6E6] dark:border-[#3D3D3D] text-center transition-colors">
            <p className="text-[#1E1E1E]/40 dark:text-white/40 text-sm">No hay propuestas activas ahora mismo.</p>
          </div>
        )}
        
        {proposals.map(proposal => {
          const proposalVotes = votes.filter(v => v.proposal_id === proposal.id);
          const hasVoted = votes.some(v => v.proposal_id === proposal.id && v.member_id === currentUser?.id);
          
          return (
            <div key={proposal.id} className="bg-white dark:bg-[#303030] p-4 rounded-2xl shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] flex items-center gap-4 transition-colors">
              <div className="text-3xl bg-[#F5F5F7] dark:bg-[#242424] w-14 h-14 rounded-xl flex items-center justify-center border border-[#E5E6E6] dark:border-[#3D3D3D]">
                {proposal.emoji}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#1E1E1E] dark:text-white truncate">{proposal.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#1E1E1E]/40 dark:text-white/40 uppercase">
                    <Tag className="w-3 h-3" />
                    {proposal.category}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#1E1E1E]/40 dark:text-white/40 uppercase">
                    <Clock className="w-3 h-3" />
                    {proposal.threshold_days} días
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => handleVote(proposal.id)}
                  className={`p-3 rounded-xl transition-all ${hasVoted ? 'bg-[#3584E4] text-white shadow-lg scale-110' : 'bg-[#F5F5F7] dark:bg-[#242424] text-[#1E1E1E]/40 dark:text-white/40 hover:text-[#3584E4]'}`}
                >
                  <ThumbsUp className={`w-5 h-5 ${hasVoted ? 'fill-current' : ''}`} />
                </button>
                <span className="text-[10px] font-bold text-[#1E1E1E]/60 dark:text-white/60">
                  {proposalVotes.length} / {membersCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
