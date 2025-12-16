import { ResetPasswordContainer } from '@/components/containers/ResetPasswordContainer';

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;
  const tokenStr = typeof token === 'string' ? token : null;

  return (
    <main>
      <ResetPasswordContainer token={tokenStr} />
    </main>
  );
}
