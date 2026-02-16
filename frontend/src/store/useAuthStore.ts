import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import api from '@/lib/api';

interface User {
    userId: string;
    email: string;
    role: string;
    fullName: string;
    phone?: string;
    profilePicture?: string;
    hasAvatar?: boolean;
    isTwoFactorAuthenticated: boolean;
}

interface AuthState {
    accessToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    fetchUser: () => Promise<void>;
    avatarVersion: number;
    refreshAvatar: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            accessToken: null,
            user: null,
            isAuthenticated: false,
            avatarVersion: 0,
            login: (token: string) => {
                try {
                    const decoded = jwtDecode<any>(token);
                    // Map token fields to User interface
                    const user: User = {
                        userId: decoded.sub || decoded.userId,
                        email: decoded.email,
                        role: decoded.role,
                        fullName: decoded.fullName || decoded.full_name,
                        phone: decoded.phone,
                        // profilePicture: decoded.profile_picture, // Removed from JWT
                        isTwoFactorAuthenticated: decoded.isTwoFactorAuthenticated
                    };
                    set({ accessToken: token, user, isAuthenticated: true });
                } catch (e) {
                    console.error("Invalid token", e);
                }
            },
            logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),
            updateUser: (updates) => set((state) => ({
                user: state.user ? { ...state.user, ...updates } : null
            })),
            fetchUser: async () => {
                const token = get().accessToken;
                if (!token) return;

                try {
                    const response = await api.get('/users/me');

                    if (response.status === 200) {
                        const userData = response.data;
                        set((state) => ({
                            user: state.user ? {
                                ...state.user,
                                fullName: userData.full_name,
                                phone: userData.phone,
                                // profilePicture: userData.profile_picture // Removed
                                hasAvatar: userData.hasAvatar
                            } : null
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching user profile", error);
                }
            },
            refreshAvatar: () => set((state) => ({ avatarVersion: state.avatarVersion + 1 }))
        }),
        {
            name: 'auth-storage',
        }
    )
);
