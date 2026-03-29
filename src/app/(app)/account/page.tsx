import { redirect } from 'next/navigation';

export default function AccountIndexPage() {
  redirect('/account/profile' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
}
