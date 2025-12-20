import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { type NextAuthOptions } from 'next-auth';
import { type AdapterAccount } from 'next-auth/adapters';
import AppleProvider from 'next-auth/providers/apple';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { prisma } from '@/lib/db/prisma';
import { UserRepository } from '@/repositories/userRepository';
import { AuthService } from '@/services/auth/authService';

const authService = new AuthService(new UserRepository());

export const authOptions: NextAuthOptions = {
  adapter: {
    ...PrismaAdapter(prisma),
    linkAccount: (account: AdapterAccount) => {
      // Map snake_case fields from provider to camelCase fields in Prisma schema
      const mappedAccount = {
        ...account,
        accessToken: account['access_token'] as string | undefined,
        refreshToken: account['refresh_token'] as string | undefined,
        expiresAt: account['expires_at'] as number | undefined,
        tokenType: account['token_type'] as string | undefined,
        idToken: account['id_token'] as string | undefined,
        sessionState: account['session_state'] as string | undefined,
      };

      // Remove snake_case fields to avoid "Unknown argument" errors
      const cleanedAccount = { ...mappedAccount } as Record<string, unknown>;
      delete cleanedAccount['access_token'];
      delete cleanedAccount['refresh_token'];
      delete cleanedAccount['expires_at'];
      delete cleanedAccount['token_type'];
      delete cleanedAccount['id_token'];
      delete cleanedAccount['session_state'];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return PrismaAdapter(prisma).linkAccount(cleanedAccount as any);
    },
  },
  secret: process.env['NEXTAUTH_SECRET'],
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) {
          return null;
        }
        const user = await authService.verifyCredentials(email, password);
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          accountState: (user.metadata as unknown as { authState?: { accountState?: string } })
            ?.authState?.accountState,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env['GOOGLE_CLIENT_ID'] ?? '',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
      profile(profile) {
        return {
          id: profile.sub,
          displayName: profile.name,
          username: profile.email?.split('@')[0] ?? `user_${Date.now()}`,
          email: profile.email,
          emailVerified: profile.email_verified ? new Date() : null,
          avatarUrl: profile.picture,
        };
      },
    }),
    AppleProvider({
      clientId: process.env['APPLE_CLIENT_ID'] ?? '',
      clientSecret: process.env['APPLE_CLIENT_SECRET'] ?? '',
      profile(profile) {
        return {
          id: profile.sub,
          displayName: profile.email ? profile.email.split('@')[0] : 'Apple User',
          username: profile.email ? profile.email.split('@')[0] : `user_${Date.now()}`,
          email: profile.email,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        // @ts-expect-error accountState is added to user
        token.accountState = user.accountState;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as { id?: string }).id = token.id as string;
        session.user.email = token.email as string;
        // @ts-expect-error accountState is added to session
        (session.user as { accountState?: string }).accountState = token.accountState as string;
      }
      return session;
    },
  },
};
