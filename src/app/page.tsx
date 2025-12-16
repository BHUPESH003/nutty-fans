import { PublicAppShellContainer } from '@/components/containers/layout/PublicAppShellContainer';
import { PublicFeed } from '@/components/feed/PublicFeed';

export default function Home() {
  return (
    <PublicAppShellContainer>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <PublicFeed />
      </main>
    </PublicAppShellContainer>
  );
}
