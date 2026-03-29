'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useMemo } from 'react';

import { apiClient } from '@/services/apiClient';
import type { LoginPayload, RegisterPayload } from '@/types/auth';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
  role?: string;
  accountState?: string;
  isCreator?: boolean;
  creatorOnboardingStatus?: string;
}

export function useAuth() {
  const { data: session, status } = useSession();

  const user = useMemo(() => {
    if (!session?.user) return null;
    return {
      id: (session.user as { id?: string }).id ?? '',
      email: session.user.email ?? '',
      displayName: session.user.name ?? undefined,
      username: (session.user as { username?: string }).username,
      avatarUrl: session.user.image,
      role: (session.user as { role?: string }).role,
      accountState: (session.user as { accountState?: string }).accountState,
      isCreator: (session.user as { isCreator?: boolean }).isCreator,
      creatorOnboardingStatus: (session.user as { creatorOnboardingStatus?: string })
        .creatorOnboardingStatus,
    } as AuthUser;
  }, [session]);

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  const login = async (payload: LoginPayload) => {
    const result = await signIn('credentials', {
      ...payload,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    return result;
  };

  const register = async (payload: RegisterPayload) => {
    await apiClient.auth.register(payload);
    // Auto-login after register
    return login({
      email: payload.email,
      password: payload.password,
    });
  };

  const logout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };
}
