'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { LogWithDetails } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUserStore } from '@/lib/store';
import { Trash2 } from 'lucide-react';
import Avatar from './Avatar';

export default function RecentActivity() {
  const [logs, setLogs] = useState<LogWithDetails[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { currentUser } = useUserStore();

  useEffect(() => {
    fetchLogs();

    const handleRefresh = () => fetchLogs();
    window.addEventListener('chore-logged', handleRefresh);
    return () => window.removeEventListener('chore-logged', handleRefresh);
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('logs')
      .select('*, member:members(*), chore:chores(*)')
      .order('done_at', { ascending: false })
      .limit(10);
      
    if (data) setLogs(data as unknown as LogWithDetails[]);
  };

  const handleDelete = async (logId: string) => {
    if (!confirm('¿Seguro que quieres deshacer esta tarea?')) return;
    
    setDeletingId(logId);
    const { error } = await supabase.from('logs').delete().eq('id', logId);
    
    if (!error) {
      // Refresh logs and dispatch event to update stats
      fetchLogs();
      window.dispatchEvent(new CustomEvent('chore-logged'));
    }
    setDeletingId(null);
  };

  if (logs.length === 0) return null;

  return (
    <div className="mt-8 mb-4">
      <h2 className="text-lg font-bold text-[#1E1E1E] dark:text-white mb-4 px-1">Actividad Reciente</h2>
      <div className="bg-white dark:bg-[#303030] rounded-xl p-2 shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] transition-colors">
        <div className="flex flex-col">
          {logs.map((log, i) => (
            <div 
              key={log.id} 
              className={`flex items-center gap-4 p-3 ${i !== logs.length - 1 ? 'border-b border-[#E5E6E6] dark:border-[#3D3D3D]' : ''}`}
            >
              <Avatar member={log.member} className="w-10 h-10 text-base" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#1E1E1E] dark:text-white truncate">
                  <span className="font-semibold">{log.member.name}</span> hizo{' '}
                  <span className="font-medium">{log.chore.name}</span> {log.chore.emoji}
                </p>
                <p className="text-xs text-[#1E1E1E]/70 dark:text-white/70 mt-0.5">
                  Hace {formatDistanceToNow(new Date(log.done_at), { locale: es })}
                </p>
              </div>
              
              {currentUser?.id === log.member_id && (
                <button
                  onClick={() => handleDelete(log.id)}
                  disabled={deletingId === log.id}
                  className="p-2 text-[#1E1E1E]/50 dark:text-white/50 hover:text-[#E01B24] dark:hover:text-[#FF7B63] hover:bg-[#E01B24]/10 dark:hover:bg-[#FF7B63]/10 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                  title="Deshacer tarea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
