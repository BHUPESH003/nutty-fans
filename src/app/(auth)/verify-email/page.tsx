import { VerifyEmailContainer } from '@/components/containers/VerifyEmailContainer';

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const tokenStr = typeof token === 'string' ? token : null;
  return <VerifyEmailContainer token={tokenStr} />;
}
