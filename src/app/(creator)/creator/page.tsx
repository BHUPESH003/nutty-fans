import { redirect } from 'next/navigation';

export default function CreatorIndexPage() {
  redirect('/creator/dashboard' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
}
