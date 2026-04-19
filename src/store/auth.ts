import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  isLoggedIn: boolean;
  username: string;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  devSkip: () => void;
}

const CREDENTIALS: Record<string, string> = {
  admin: '1234',
  pharmacist: '5678',
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      username: '',
      login: (user, pass) => {
        if (CREDENTIALS[user] === pass) {
          set({ isLoggedIn: true, username: user });
          return true;
        }
        return false;
      },
      logout: () => set({ isLoggedIn: false, username: '' }),
      devSkip: () => set({ isLoggedIn: true, username: 'dev' }),
    }),
    { name: 'ct-auth' }
  )
);
