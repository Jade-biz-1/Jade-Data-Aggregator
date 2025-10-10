import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { User, AuthResponse, LoginData } from '@/types';
import { apiClient } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginData) => Promise<void>;
  logout: () => void;
  register: (userData: { username: string; email: string; password: string }) => Promise<void>;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginData) => {
        set({ isLoading: true });
        try {
          const result = await apiClient.login(credentials.username, credentials.password);

          // Store token in cookies first
          Cookies.set('access_token', result.access_token, { expires: 7 });

          // Now get the user with the token set
          const user = await apiClient.getCurrentUser();

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        Cookies.remove('access_token');
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          // Register the user - backend returns the user object
          const user = await apiClient.register(userData);

          // After registration, log them in to get a token
          const result = await apiClient.login(userData.username, userData.password);

          // Store token in cookies
          Cookies.set('access_token', result.access_token, { expires: 7 });

          // Use the user data we already got from registration
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      checkAuth: async () => {
        const token = Cookies.get('access_token');
        if (token && !get().isAuthenticated) {
          try {
            const user = await apiClient.getCurrentUser();
            set({
              user,
              isAuthenticated: true,
            });
          } catch (error) {
            // Token exists but is invalid, so remove it
            Cookies.remove('access_token');
            set({
              user: null,
              isAuthenticated: false,
            });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);