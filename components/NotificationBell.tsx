'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, Heart, RefreshCw, Check, X as CloseIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { ThanksWithDetails, ColorTradeWithDetails, NotificationType } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Avatar from './Avatar';
import PushNotificationBanner from './PushNotificationBanner';

export default function NotificationBell() {
  const { currentUser, lastSeenNotifications, setLastSeenNotifications } = useUserStore();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;

    const [{ data: thanksData }, { data: tradeData }] = await Promise.all([
      supabase
        .from('thanks')
        .select('*, from_member:members!thanks_from_member_id_fkey(*), log:logs(*, chore:chores(*))')
        .eq('to_member_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('color_trades')
        .select('*, from_member:members!color_trades_from_member_id_fkey(*), to_member:members!color_trades_to_member_id_fkey(*)')
        .eq('to_member_id', currentUser.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
    ]);

    const combined: NotificationType[] = [
      ...(thanksData?.map(d => ({ type: 'thanks' as const, data: d as unknown as ThanksWithDetails })) || []),
      ...(tradeData?.map(d => ({ type: 'trade' as const, data: d as unknown as ColorTradeWithDetails })) || [])
    ].sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime());

    setNotifications(combined);
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();

    const handler = () => fetchNotifications();
    window.addEventListener('thanks-updated', handler);
    window.addEventListener('trade-updated', handler);
    return () => {
      window.removeEventListener('thanks-updated', handler);
      window.removeEventListener('trade-updated', handler);
    };
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

  const handleTradeAction = async (trade: ColorTradeWithDetails, action: 'accepted' | 'declined') => {
    if (!currentUser) return;

    if (action === 'accepted') {
      // Perform the swap
      const { error: swapError } = await supabase.rpc('swap_member_colors', {
        member_a_id: trade.from_member_id,
        member_b_id: trade.to_member_id
      });

      if (swapError) {
        console.error('Error swapping colors:', swapError);
        alert('Error al intercambiar colores');
        return;
      }
    }

    // Update trade status
    await supabase
      .from('color_trades')
      .update({ status: action, updated_at: new Date().toISOString() })
      .eq('id', trade.id);

    // If accepted, decline all other pending trades for these users
    if (action === 'accepted') {
      await supabase
        .from('color_trades')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .neq('id', trade.id)
        .or(`from_member_id.eq.${trade.from_member_id},to_member_id.eq.${trade.to_member_id},from_member_id.eq.${trade.to_member_id},to_member_id.eq.${trade.from_member_id}`)
        .eq('status', 'pending');
    }

    window.dispatchEvent(new CustomEvent('trade-updated'));
    window.dispatchEvent(new CustomEvent('member-updated'));
  };

  const unreadCount = notifications.filter((n) => {
    if (!lastSeenNotifications) return true;
    return new Date(n.data.created_at) > new Date(lastSeenNotifications);
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
              <span className="text-xs text-[#1E1E1E]/50 dark:text-white/50">
                {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
          <PushNotificationBanner memberId={currentUser.id} />

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Bell className="w-8 h-8 text-[#1E1E1E]/20 dark:text-white/20 mb-2" />
                <p className="text-sm text-[#1E1E1E]/50 dark:text-white/50">Sin notificaciones aún</p>
              </div>
            ) : (
              notifications.map((notif, i) => {
                const isThanks = notif.type === 'thanks';
                const data = notif.data;
                const isNew = lastSeenNotifications && new Date(data.created_at) > new Date(lastSeenNotifications);

                return (
                  <div
                    key={isThanks ? (data as ThanksWithDetails).id : (data as ColorTradeWithDetails).id}
                    className={`flex flex-col px-4 py-3 ${
                      i !== notifications.length - 1 ? 'border-b border-[#E5E6E6] dark:border-[#3D3D3D]' : ''
                    } ${isNew ? 'bg-[#3584E4]/5 dark:bg-[#3584E4]/10' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <Avatar member={(data as any).from_member} className="w-9 h-9 text-sm" />
                        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${isThanks ? 'bg-[#E01B24]' : 'bg-[#3584E4]'}`}>
                          {isThanks ? (
                            <Heart className="w-2.5 h-2.5 text-white" fill="white" />
                          ) : (
                            <RefreshCw className="w-2.5 h-2.5 text-white" />
                          )}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {isThanks ? (
                          <p className="text-sm text-[#1E1E1E] dark:text-white leading-snug">
                            <span className="font-semibold">{(data as ThanksWithDetails).from_member.name}</span> te agradeció por{' '}
                            <span className="font-medium">{(data as ThanksWithDetails).log?.chore?.name}</span>{' '}
                            {(data as ThanksWithDetails).log?.chore?.emoji}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-[#1E1E1E] dark:text-white leading-snug">
                              <span className="font-semibold">{(data as ColorTradeWithDetails).from_member.name}</span> quiere intercambiar su color contigo
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: (data as ColorTradeWithDetails).from_member.color }} />
                                <span className="text-[10px] text-[#1E1E1E]/40 dark:text-white/40">Su color</span>
                              </div>
                              <RefreshCw className="w-3 h-3 text-[#1E1E1E]/20 dark:text-white/20" />
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: (data as ColorTradeWithDetails).to_member.color }} />
                                <span className="text-[10px] text-[#1E1E1E]/40 dark:text-white/40">Tu color</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleTradeAction(data as ColorTradeWithDetails, 'accepted')}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#3584E4] hover:bg-[#1C71D8] text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                Aceptar
                              </button>
                              <button
                                onClick={() => handleTradeAction(data as ColorTradeWithDetails, 'declined')}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#E5E6E6] dark:bg-[#3D3D3D] hover:bg-[#D4D4D4] dark:hover:bg-[#474747] text-[#1E1E1E] dark:text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                <CloseIcon className="w-3 h-3" />
                                Rechazar
                              </button>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-[#1E1E1E]/50 dark:text-white/50 mt-1">
                          Hace {formatDistanceToNow(new Date(data.created_at), { locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
