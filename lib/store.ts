import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Member } from './types';

type UserState = {
  currentUser: Member | null;
  setCurrentUser: (user: Member | null) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
    }),
    {
      name: 'otelo-user-storage',
    }
  )
);
