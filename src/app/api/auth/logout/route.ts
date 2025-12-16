import { NextResponse } from 'next/server';

// This endpoint exists primarily to satisfy the apiClient contract.
// Frontend should prefer next-auth's `signOut` for logout, but this
// provides a simple server-side hook if needed.

export async function POST(): Promise<NextResponse> {
  // Logout is mainly handled client-side by clearing the session via NextAuth.
  return NextResponse.json({ message: 'Logged out' });
}
