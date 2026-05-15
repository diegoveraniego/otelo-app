'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, Heart, RefreshCw, Check, X as CloseIcon } from 'lucide-react';
import { notificationService } from '@/lib/services/notificationService';
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
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const { thanks, trades } = await notificationService.getAllNotifications(currentUser.id);

      const combined: NotificationType[] = [
        ...thanks.map(d => ({ type: 'thanks' as const, data: d as unknown as ThanksWithDetails })),
        ...trades.map(d => ({ type: 'trade' as const, data: d as unknown as ColorTradeWithDetails }))
      ].sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime());

      setNotifications(combined);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
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
      setLastSeenNotifications(new Date().toISOString());
    }
  };

  const handleTradeAction = async (trade: ColorTradeWithDetails, action: 'accepted' | 'declined') => {
    if (!currentUser) return;
    try {
      await notificationService.respondToColorTrade(trade.id, action, trade.from_member_id, trade.to_member_id);
      window.dispatchEvent(new CustomEvent('trade-updated'));
      window.dispatchEvent(new CustomEvent('member-updated'));
    } catch (err) {
      console.error('Error responding to trade:', err);
      alert('Error al procesar el intercambio');
    }
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
          className="absolute right-0 top-12 w-80 bg-white dark:bg-[#303030] rounded-2xl shadow-2xl border border-[#E5E6E6] dark:border-[#3D3D3D] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="px-5 py-4 border-b border-[#E5E6E6] dark:border-[#3D3D3D] flex items-center justify-between bg-[#FAFAFA] dark:bg-[#2A2A2A]">
            <h3 className="font-bold text-sm text-[#1E1E1E] dark:text-white">Notificaciones</h3>
            {isLoading && <span className="w-3 h-3 rounded-full border-2 border-[#3584E4] border-t-transparent animate-spin" />}
          </div>
          
          <PushNotificationBanner memberId={currentUser.id} />

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="w-10 h-10 text-[#1E1E1E]/10 dark:text-white/10 mb-2" />
                <p className="text-sm text-[#1E1E1E]/40 dark:text-white/40 font-medium">Sin notificaciones aún</p>
              </div>
            ) : (
              notifications.map((notif, i) => {
                const isThanks = notif.type === 'thanks';
                const data = notif.data;
                const isNew = lastSeenNotifications && new Date(data.created_at) > new Date(lastSeenNotifications);

                return (
                  <div
                    key={isThanks ? (data as ThanksWithDetails).id : (data as ColorTradeWithDetails).id}
                    className={`flex flex-col px-5 py-4 ${
                      i !== notifications.length - 1 ? 'border-b border-[#E5E6E6] dark:border-[#3D3D3D]' : ''
                    } ${isNew ? 'bg-[#3584E4]/5 dark:bg-[#3584E4]/10' : ''} hover:bg-[#FAFAFA] dark:hover:bg-[#353535] transition-colors`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        <Avatar member={(data as any).from_member} className="w-10 h-10 text-base" />
                        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${isThanks ? 'bg-[#E01B24]' : 'bg-[#3584E4]'}`}>
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
                            <span className="font-bold">{(data as ThanksWithDetails).from_member.name}</span> te agradeció por{' '}
                            <span className="font-medium text-[#3584E4]">{(data as ThanksWithDetails).log?.chore?.name}</span>{' '}
                            {(data as ThanksWithDetails).log?.chore?.emoji}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-[#1E1E1E] dark:text-white leading-snug">
                              <span className="font-bold">{(data as ColorTradeWithDetails).from_member.name}</span> quiere intercambiar su color contigo
                            </p>
                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-black/20 p-2 rounded-xl border border-gray-100 dark:border-white/5">
                              <div className="flex flex-col items-center gap-1 flex-1">
                                <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: (data as ColorTradeWithDetails).from_member.color }} />
                                <span className="text-[8px] font-black uppercase text-gray-400">Suya</span>
                              </div>
                              <RefreshCw className="w-3 h-3 text-gray-300" />
                              <div className="flex flex-col items-center gap-1 flex-1">
                                <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: (data as ColorTradeWithDetails).to_member.color }} />
                                <span className="text-[8px] font-black uppercase text-gray-400">Tuya</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleTradeAction(data as ColorTradeWithDetails, 'accepted')}
                                className="flex-1 py-2 bg-[#3584E4] hover:bg-[#1C71D8] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                              >
                                Aceptar
                              </button>
                              <button
                                onClick={() => handleTradeAction(data as ColorTradeWithDetails, 'declined')}
                                className="flex-1 py-2 bg-gray-100 dark:bg-[#3D3D3D] text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-[#474747] transition-all active:scale-95"
                              >
                                Rechazar
                              </button>
                            </div>
                          </div>
                        )}
                        <p className="text-[10px] text-[#1E1E1E]/40 dark:text-white/30 mt-1.5 font-medium">
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
