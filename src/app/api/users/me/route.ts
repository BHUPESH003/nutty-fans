import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { UserRepository } from '@/repositories/userRepository';

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userRepo = new UserRepository();
  const user = await userRepo.findByEmail(session.user.email);
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const metadata = (user.metadata ?? {}) as Record<string, unknown>;
  const authState = (metadata['authState'] as Record<string, unknown>) ?? {};

  return NextResponse.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    username: user.username,
    role: user.role,
    accountState: authState['accountState'] ?? 'active',
    ageStatus: authState['ageStatus'] ?? null,
  });
}
