'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { ThanksWithDetails } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Avatar from './Avatar';

export default function NotificationBell() {
  const { currentUser, lastSeenNotifications, setLastSeenNotifications } = useUserStore();
  const [notifications, setNotifications] = useState<ThanksWithDetails[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;

    const { data } = await supabase
      .from('thanks')
      .select('*, from_member:members!thanks_from_member_id_fkey(*), log:logs(*, chore:chores(*))')
      .eq('to_member_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data as unknown as ThanksWithDetails[]);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();

    const handler = () => fetchNotifications();
    window.addEventListener('thanks-updated', handler);
    return () => window.removeEventListener('thanks-updated', handler);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      // Mark all as seen when opening
      setLastSeenNotifications(new Date().toISOString());
    }
  };

  const unreadCount = notifications.filter((n) => {
    if (!lastSeenNotifications) return true;
    return new Date(n.created_at) > new Date(lastSeenNotifications);
  }).length;

  if (!isClient || !currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="notification-bell-button"
        onClick={handleOpen}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#303030] shadow-sm border border-[#E5E6E6] dark:border-[#3D3D3D] hover:bg-[#FAFAFA] dark:hover:bg-[#3D3D3D] transition-colors"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5 text-[#1E1E1E] dark:text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#E01B24] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in duration-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="notification-dropdown"
          className="absolute right-0 top-12 w-80 bg-white dark:bg-[#303030] rounded-xl shadow-xl border border-[#E5E6E6] dark:border-[#3D3D3D] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="px-4 py-3 border-b border-[#E5E6E6] dark:border-[#3D3D3D] flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#1E1E1E] dark:text-white">Notificaciones</h3>
            {notifications.length > 0 && (
              <span className="text-xs text-[#1E1E1E]/50 dark:text-white/50">{notifications.length} agradecimiento{notifications.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Heart className="w-8 h-8 text-[#1E1E1E]/20 dark:text-white/20 mb-2" />
                <p className="text-sm text-[#1E1E1E]/50 dark:text-white/50">Sin agradecimientos aún</p>
                <p className="text-xs text-[#1E1E1E]/30 dark:text-white/30 mt-1">¡Sigue haciendo tareas!</p>
              </div>
            ) : (
              notifications.map((notif, i) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 ${
                    i !== notifications.length - 1 ? 'border-b border-[#E5E6E6] dark:border-[#3D3D3D]' : ''
                  } ${
                    lastSeenNotifications && new Date(notif.created_at) > new Date(lastSeenNotifications)
                      ? 'bg-[#3584E4]/5 dark:bg-[#3584E4]/10'
                      : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar member={notif.from_member} className="w-9 h-9 text-sm" />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#E01B24] rounded-full flex items-center justify-center">
                      <Heart className="w-2.5 h-2.5 text-white" fill="white" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1E1E1E] dark:text-white leading-snug">
                      <span className="font-semibold">{notif.from_member.name}</span> te agradeció por{' '}
                      <span className="font-medium">{notif.log?.chore?.name}</span>{' '}
                      {notif.log?.chore?.emoji}
                    </p>
                    <p className="text-xs text-[#1E1E1E]/50 dark:text-white/50 mt-0.5">
                      Hace {formatDistanceToNow(new Date(notif.created_at), { locale: es })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
