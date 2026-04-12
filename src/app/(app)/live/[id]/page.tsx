import { redirect } from 'next/navigation';

export default async function LiveWatchPage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  redirect('/');
}
