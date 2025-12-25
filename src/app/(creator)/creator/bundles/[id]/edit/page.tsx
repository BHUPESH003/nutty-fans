import { BundleEditorContainer } from '@/components/containers/creator/BundleEditorContainer';

export default async function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BundleEditorContainer bundleId={id} />;
}
