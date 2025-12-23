import { redirect } from 'next/navigation';

// Redirect old /creator/apply URL to new onboarding flow
export default function CreatorApplyPage() {
  redirect('/creator/start');
}
