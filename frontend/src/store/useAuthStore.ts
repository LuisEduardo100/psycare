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
    hasProfile?: boolean;
    isTwoFactorAuthenticated: boolean;

    // Doctor Fields
    crm?: string;
    uf?: string;
    cpf?: string;
    rqe?: string;
    clinic_address?: any;
    certificate_serial?: string;
    is_verified?: boolean;
    onboarding_status?: number;
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
                                hasAvatar: userData.hasAvatar,
                                hasProfile: userData.hasProfile,

                                // Map new fields
                                crm: userData.crm,
                                uf: userData.uf,
                                cpf: userData.cpf,
                                rqe: userData.rqe,
                                clinic_address: userData.clinic_address,
                                certificate_serial: userData.certificate_serial,
                                is_verified: userData.is_verified,
                                onboarding_status: userData.onboarding_status,
                            } : null
                        }));
                    }
                } catch (error: any) {
                    // Prevent loop: if 401, just error out (interceptor handles logout)
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
