import { redirect } from 'next/navigation';

export default function SubscriptionsPage() {
  redirect('/account/subscriptions' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
}
