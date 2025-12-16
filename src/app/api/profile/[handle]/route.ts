import type { NextRequest } from 'next/server';

import { profileController } from '@/app/api/_controllers/profileController';

export async function GET(req: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return profileController.byHandle(req, handle);
}
