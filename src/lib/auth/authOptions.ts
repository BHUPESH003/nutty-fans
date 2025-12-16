import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { type NextAuthOptions, type Session } from 'next-auth';
import AppleProvider from 'next-auth/providers/apple';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { prisma } from '@/lib/db/prisma';
import { UserRepository } from '@/repositories/userRepository';
import { AuthService } from '@/services/auth/authService';

const authService = new AuthService(new UserRepository());

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
        };
      },
    }),
    GoogleProvider({
      clientId: process.env['GOOGLE_CLIENT_ID'] ?? '',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
    }),
    AppleProvider({
      clientId: process.env['APPLE_CLIENT_ID'] ?? '',
      clientSecret: process.env['APPLE_CLIENT_SECRET'] ?? '',
    }),
  ],
  callbacks: {
    async session({ session, user }: { session: Session; user: { id: string; email: string } }) {
      // Attach minimal user info; do not include sensitive PII.
      if (session.user) {
        (session.user as { id?: string }).id = user.id;
        session.user.email = user.email;
      }
      return session;
    },
  },
};
