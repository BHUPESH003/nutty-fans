import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { UserRepository } from '@/repositories/userRepository';

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  // Check for session ID first (more reliable), then email
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  if (!userId && !userEmail) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userRepo = new UserRepository();
  let user;

  if (userId) {
    user = await userRepo.findById(userId);
  } else if (userEmail) {
    user = await userRepo.findByEmail(userEmail);
  }

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

export async function DELETE(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userRepo = new UserRepository();
  await userRepo.softDelete(userId);

  return NextResponse.json({
    code: 200,
    message: 'Account deleted successfully',
    data: { success: true },
  });
}
