import { Metadata } from 'next';

import { PostCreationContainer } from '@/components/containers/posts/PostCreationContainer';

export const metadata: Metadata = {
  title: 'Create Post | NuttyFans',
  description: 'Share your content with your fans.',
};

export default function CreatePostPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Create Post</h1>
      <PostCreationContainer />
    </div>
  );
}
