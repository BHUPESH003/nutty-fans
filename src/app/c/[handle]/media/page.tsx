import { CreatorProfileContainer } from '@/components/containers/creator/CreatorProfileContainer';

export default async function CreatorMediaPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  return <CreatorProfileContainer handle={handle} activeTab="media" />;
}
