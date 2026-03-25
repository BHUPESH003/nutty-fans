import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Post | NuttyFans',
  description: 'View post details.',
};

export default function PostPage() {
  // Comments are handled via an in-feed bottom tray. Keep this route from
  // rendering a navigation-less view.
  redirect('/');
}
