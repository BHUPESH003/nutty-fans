import { HomeFeedWrapper } from '@/components/home/HomeFeedWrapper';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="w-full min-w-0">
      <HomeFeedWrapper />
    </div>
  );
}
