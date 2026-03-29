import { redirect } from 'next/navigation';

export default function EditProfilePage() {
  redirect('/account/profile/edit' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
}
