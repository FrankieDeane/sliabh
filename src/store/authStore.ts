import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

interface AuthState {
  user: UserProfile | null;
  session: string | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setSession: (token: string | null) => void;
  setLoading: (v: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),
      signOut: () => set({ user: null, session: null }),
    }),
    { name: 'auth', storage: createJSONStorage(() => mmkvStorage) },
  ),
);
