import { Metadata } from 'next';

import { PostDetailContainer } from '@/components/containers/posts/PostDetailContainer';

export const metadata: Metadata = {
  title: 'Post | NuttyFans',
  description: 'View post details.',
};

export default function PostPage() {
  return <PostDetailContainer />;
}
