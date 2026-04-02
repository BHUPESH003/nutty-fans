import { NextResponse } from 'next/server';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await params;
  return NextResponse.redirect(new URL('/', _req.url));
}
