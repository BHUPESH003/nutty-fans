import { LiveStreamWatchContainer } from '@/components/containers/live/LiveStreamWatchContainer';

export default async function LiveWatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LiveStreamWatchContainer streamId={id} />;
}
