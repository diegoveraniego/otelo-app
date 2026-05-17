'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { Member, Chore, LogWithDetails } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  History, 
  User, 
  ClipboardList, 
  Calendar, 
  Trash2, 
  ChevronDown, 
  RotateCcw, 
  ArrowUpDown,
  FilterX
} from 'lucide-react';
import Avatar from '@/components/Avatar';

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const { currentUser } = useUserStore();
  const [mounted, setMounted] = useState(false);

  // Data states
  const [logs, setLogs] = useState<LogWithDetails[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedChore, setSelectedChore] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Control states
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch initial helper data (members & chores list for dropdowns)
  const fetchFilterOptions = useCallback(async () => {
    if (!currentUser?.home_id) return;

    try {
      const [membersRes, choresRes] = await Promise.all([
        supabase.from('members').select('*').eq('home_id', currentUser.home_id).order('name'),
        supabase.from('chores').select('*').eq('home_id', currentUser.home_id).order('name')
      ]);

      if (membersRes.data) setMembers(membersRes.data as Member[]);
      if (choresRes.data) setChores(choresRes.data as Chore[]);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, [currentUser?.home_id]);

  // Main chronological log fetcher
  const fetchLogs = useCallback(async (pageNum = 0, append = false) => {
    if (!currentUser?.home_id) return;
    setIsLoading(true);

    try {
      let query = supabase
        .from('logs')
        .select(`
          *,
          member:members(*),
          chore:chores(*)
        `, { count: 'exact' })
        .eq('home_id', currentUser.home_id);

      // Apply Member Filter
      if (selectedMember) {
        query = query.eq('member_id', selectedMember);
      }

      // Apply Chore Filter
      if (selectedChore) {
        query = query.eq('chore_id', selectedChore);
      }

      // Apply Start Date Filter
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query = query.gte('done_at', start.toISOString());
      }

      // Apply End Date Filter
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('done_at', end.toISOString());
      }

      // Apply Sort Order
      query = query.order('done_at', { ascending: sortOrder === 'asc' });

      // Apply Pagination
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      const formattedData = data as unknown as LogWithDetails[];

      if (append) {
        setLogs(prev => [...prev, ...formattedData]);
      } else {
        setLogs(formattedData);
      }
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error('Error fetching history logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.home_id, selectedMember, selectedChore, startDate, endDate, sortOrder]);

  // Handle filter changes (Reset page to 0)
  useEffect(() => {
    setMounted(true);
    if (currentUser?.home_id) {
      fetchFilterOptions();
      setPage(0);
      fetchLogs(0, false);
    }
  }, [currentUser?.home_id, selectedMember, selectedChore, startDate, endDate, sortOrder, fetchFilterOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle loading more pages
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage, true);
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setSelectedMember('');
    setSelectedChore('');
    setStartDate('');
    setEndDate('');
    setSortOrder('desc');
    setPage(0);
  };

  // Delete/Undo log
  const handleDeleteLog = async (log: LogWithDetails) => {
    const isOwn = log.member_id === currentUser?.id;
    const isAdmin = currentUser?.role === 'admin';

    const confirmMsg = isAdmin && !isOwn
      ? `¿Estás seguro de que deseas eliminar esta tarea de ${log.member.name} como administrador?`
      : '¿Seguro que quieres deshacer esta tarea?';

    if (!confirm(confirmMsg)) return;

    setIsDeleting(log.id);
    try {
      const { error } = await supabase.from('logs').delete().eq('id', log.id);
      if (error) throw error;

      // Update UI in real-time
      setLogs(prev => prev.filter(l => l.id !== log.id));
      setTotalCount(prev => Math.max(0, prev - 1));

      // Broadcast changes to other components (like RecentActivity, Gamification, Stats)
      window.dispatchEvent(new CustomEvent('chore-logged'));
    } catch (err) {
      console.error('Error deleting log:', err);
      alert('No se pudo eliminar el registro.');
    } finally {
      setIsDeleting(null);
    }
  };

  if (!mounted || !currentUser) return null;

  const hasMore = logs.length < totalCount;
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="animate-in fade-in duration-500 pb-8 mt-2 max-w-4xl mx-auto px-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#3584E4]/10 dark:bg-[#3584E4]/20 p-2.5 rounded-xl text-[#3584E4]">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] dark:text-white">Historial de Tareas</h1>
          <p className="text-sm text-[#1E1E1E]/60 dark:text-white/60">
            Cronología completa de actividades y auditoría de registros del hogar.
          </p>
        </div>
      </div>

      {/* Filters Box */}
      <div className="bg-white dark:bg-[#303030] rounded-2xl p-5 shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] mb-6 transition-colors">
        <h2 className="text-sm font-bold text-[#1E1E1E]/80 dark:text-white/80 mb-4 flex items-center gap-2">
          Filtrar y Buscar Registros
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Member selector */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-[#1E1E1E]/60 dark:text-white/50 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Miembro
            </label>
            <div className="relative">
              <select
                value={selectedMember}
                onChange={e => setSelectedMember(e.target.value)}
                className="w-full appearance-none bg-[#FAFAFA] dark:bg-[#252525] border border-[#E5E6E6] dark:border-[#404040] rounded-xl px-3 py-2.5 text-sm text-[#1E1E1E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3584E4] transition-all cursor-pointer pr-10"
              >
                <option value="">Todos los miembros</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#1E1E1E]/40 dark:text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* Chore selector */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-[#1E1E1E]/60 dark:text-white/50 mb-1.5 flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" /> Tarea
            </label>
            <div className="relative">
              <select
                value={selectedChore}
                onChange={e => setSelectedChore(e.target.value)}
                className="w-full appearance-none bg-[#FAFAFA] dark:bg-[#252525] border border-[#E5E6E6] dark:border-[#404040] rounded-xl px-3 py-2.5 text-sm text-[#1E1E1E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3584E4] transition-all cursor-pointer pr-10"
              >
                <option value="">Todas las tareas</option>
                {chores.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#1E1E1E]/40 dark:text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* Start Date */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-[#1E1E1E]/60 dark:text-white/50 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-[#FAFAFA] dark:bg-[#252525] border border-[#E5E6E6] dark:border-[#404040] rounded-xl px-3 py-2 text-sm text-[#1E1E1E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3584E4] transition-all"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-[#1E1E1E]/60 dark:text-white/50 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-[#FAFAFA] dark:bg-[#252525] border border-[#E5E6E6] dark:border-[#404040] rounded-xl px-3 py-2 text-sm text-[#1E1E1E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3584E4] transition-all"
            />
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-[#E5E6E6]/60 dark:border-[#3D3D3D]/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#FAFAFA] dark:bg-[#252525] hover:bg-[#F0F0F0] dark:hover:bg-[#353535] border border-[#E5E6E6] dark:border-[#404040] rounded-xl px-3.5 py-2 text-[#1E1E1E] dark:text-white transition-all hover:scale-102 active:scale-98"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguas primero'}
            </button>

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors px-3 py-2 rounded-xl"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar
            </button>
          </div>

          <div className="text-xs font-bold text-[#1E1E1E]/60 dark:text-white/60 bg-[#FAFAFA] dark:bg-[#252525] border border-[#E5E6E6] dark:border-[#404040] rounded-xl px-3 py-2">
            Total: {totalCount} {totalCount === 1 ? 'tarea' : 'tareas'}
          </div>
        </div>
      </div>

      {/* Audit List Container */}
      <div className="bg-white dark:bg-[#303030] rounded-2xl overflow-hidden shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors mb-6">
        {logs.length > 0 ? (
          <div className="flex flex-col">
            {logs.map((log, index) => {
              const isOwnLog = log.member_id === currentUser.id;
              const canDelete = isOwnLog || isAdmin;
              const exactTime = format(new Date(log.done_at), "eeee d 'de' MMMM, yyyy 'a las' HH:mm:ss", { locale: es });
              // Capitalize the first letter of the day
              const capitalizedTime = exactTime.charAt(0).toUpperCase() + exactTime.slice(1);

              return (
                <div
                  key={log.id}
                  className={`flex items-center gap-4 p-4 ${
                    index !== logs.length - 1 ? 'border-b border-[#E5E6E6] dark:border-[#3D3D3D]' : ''
                  } hover:bg-[#FAFAFA] dark:hover:bg-[#353535] transition-colors group`}
                >
                  <Avatar member={log.member} className="w-11 h-11 text-base shrink-0 border border-white/10" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1E1E1E] dark:text-white">
                      <span className="font-bold">{log.member.name}</span> hizo{' '}
                      <span className="font-semibold text-[#3584E4] dark:text-sky-400">{log.chore.name}</span> {log.chore.emoji}
                    </p>
                    <p className="text-[11px] text-[#1E1E1E]/50 dark:text-white/40 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {capitalizedTime}
                    </p>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteLog(log)}
                      disabled={isDeleting === log.id}
                      title={isAdmin && !isOwnLog ? "Eliminar como Administrador" : "Deshacer mi tarea"}
                      className={`p-2.5 rounded-xl border border-transparent transition-all ${
                        isAdmin && !isOwnLog
                          ? 'text-[#E01B24]/40 hover:text-[#E01B24] hover:bg-[#E01B24]/10 hover:border-[#E01B24]/10'
                          : 'text-neutral-400 hover:text-[#E01B24] hover:bg-[#E01B24]/10 hover:border-[#E01B24]/10'
                      } ${
                        isDeleting === log.id ? 'opacity-50 pointer-events-none' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                      }`}
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-[#1E1E1E]/50 dark:text-white/40">
            <FilterX className="w-12 h-12 mb-3 text-neutral-300 dark:text-neutral-600" />
            <p className="text-sm font-semibold">No se encontraron registros</p>
            <p className="text-xs mt-1">Intenta ajustando o limpiando los filtros para ver más resultados.</p>
          </div>
        )}
      </div>

      {/* Pagination Load More */}
      {hasMore && !isLoading && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            className="flex items-center gap-1.5 text-sm font-bold bg-[#3584E4] hover:bg-[#1c71d8] dark:bg-[#3584E4] text-white rounded-xl px-6 py-3.5 shadow-md shadow-blue-500/10 transition-all hover:scale-102 active:scale-98"
          >
            Cargar más registros
          </button>
        </div>
      )}

      {/* Bottom Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center p-4">
          <span className="w-6 h-6 rounded-full border-3 border-[#3584E4] border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
