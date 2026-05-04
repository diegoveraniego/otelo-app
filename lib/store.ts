import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Member } from './types';

type UserState = {
  currentUser: Member | null;
  setCurrentUser: (user: Member | null) => void;
  lastSeenNotifications: string | null;
  setLastSeenNotifications: (ts: string) => void;
  hasDismissedUserModal: boolean;
  setHasDismissedUserModal: (dismissed: boolean) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      lastSeenNotifications: null,
      setLastSeenNotifications: (ts) => set({ lastSeenNotifications: ts }),
      hasDismissedUserModal: false,
      setHasDismissedUserModal: (dismissed) => set({ hasDismissedUserModal: dismissed }),
    }),
    {
      name: 'otelo-user-storage',
    }
  )
);
