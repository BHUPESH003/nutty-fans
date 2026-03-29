import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getToken } = vi.hoisted(() => ({
  getToken: vi.fn(),
}));

vi.mock('next-auth/jwt', () => ({
  getToken,
}));

import { middleware } from '@/middleware';

function createRequest(pathname: string, options?: { ageVerified?: boolean }): NextRequest {
  const url = new URL(pathname, 'http://localhost:3000');

  return {
    url: url.toString(),
    nextUrl: url,
    cookies: {
      get: (name: string) => {
        if (name === 'age_verified' && options?.ageVerified) {
          return { value: 'true' };
        }

        return undefined;
      },
    },
  } as NextRequest;
}

describe('middleware', () => {
  beforeEach(() => {
    getToken.mockReset();
    getToken.mockResolvedValue(null);
  });

  it('redirects anonymous users away from the home page to login', async () => {
    const request = createRequest('/', { ageVerified: true });

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?callbackUrl=%2F');
  });

  it('allows anonymous users to access public creator profiles', async () => {
    const request = createRequest('/c/test-creator', { ageVerified: true });

    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects age-verified anonymous users from the age gate to login', async () => {
    const request = createRequest('/age-gate', { ageVerified: true });

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('redirects authenticated users from login to the app home', async () => {
    getToken.mockResolvedValue({ sub: 'user-123' });

    const request = createRequest('/login', { ageVerified: true });

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/');
  });
});
