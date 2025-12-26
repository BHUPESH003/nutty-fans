/**
 * Vitest Setup File
 *
 * This file is executed before all tests.
 * Configure global mocks, test utilities, and environment.
 */

import React from 'react';
import { afterEach, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = 'test-secret-for-testing-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Global test utilities
declare global {
  var testUtils: {
    mockUser: typeof mockUser;
    mockCreator: typeof mockCreator;
    mockSession: typeof mockSession;
  };
}

const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  role: 'user' as const,
  isVerified: true,
  createdAt: new Date('2024-01-01'),
};

const mockCreator = {
  id: 'test-creator-id-456',
  email: 'creator@example.com',
  username: 'testcreator',
  displayName: 'Test Creator',
  role: 'creator' as const,
  isVerified: true,
  createdAt: new Date('2024-01-01'),
  creatorProfile: {
    id: 'creator-profile-id',
    userId: 'test-creator-id-456',
    displayName: 'Test Creator',
    bio: 'Test bio',
    subscriptionPrice: 9.99,
    isVerified: true,
    kycStatus: 'verified' as const,
  },
};

const mockSession = {
  user: {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.displayName,
    role: mockUser.role,
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

globalThis.testUtils = {
  mockUser,
  mockCreator,
  mockSession,
};

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
