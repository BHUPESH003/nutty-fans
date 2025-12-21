import { HomeFeedWrapper } from '@/components/home/HomeFeedWrapper';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <HomeFeedWrapper />
    </main>
  );
}
