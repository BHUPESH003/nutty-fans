import { redirect } from 'next/navigation';

export default function TransactionsPage() {
  redirect('/creator/transactions' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
}
