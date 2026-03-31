import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: Request) {
  const secret = process.env['NEXTAUTH_SECRET'];

  if (!secret) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const token = await getToken({
    req: request as Parameters<typeof getToken>[0]['req'],
    secret,
    raw: true,
  });

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ token });
}
