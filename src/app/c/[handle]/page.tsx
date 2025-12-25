import { CreatorProfileContainer } from '@/components/containers/creator/CreatorProfileContainer';

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return <CreatorProfileContainer handle={handle} />;
}
