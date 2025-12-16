import { NextResponse } from 'next/server';

import { CreatorRepository } from '@/repositories/creatorRepository';
import { UserRepository } from '@/repositories/userRepository';
import { CreatorService } from '@/services/creator/creatorService';

const creatorService = new CreatorService(new CreatorRepository(), new UserRepository());

export async function GET(_req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;

  const profile = await creatorService.getPublicProfile(handle);
  if (!profile) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Creator not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json(profile);
}
