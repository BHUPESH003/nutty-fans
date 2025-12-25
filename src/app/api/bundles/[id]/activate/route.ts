import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { bundleController } from '@/app/api/_controllers/bundleController';
import { authOptions } from '@/lib/auth/authOptions';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }
  const { id } = await params;
  return bundleController.activateMyBundle(session.user.id, id);
}
