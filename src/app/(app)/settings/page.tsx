import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/account/settings' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
}
