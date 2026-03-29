import { redirect } from 'next/navigation';

export default function WalletPage() {
  redirect('/account/wallet' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
}
