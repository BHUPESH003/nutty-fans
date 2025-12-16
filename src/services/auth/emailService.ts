type VerificationEmailParams = {
  email: string;
  token: string;
};

type ResetEmailParams = {
  email: string;
  token: string;
};

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? process.env['NEXTAUTH_URL'] ?? '';

export class EmailService {
  async sendVerificationEmail(params: VerificationEmailParams): Promise<void> {
    const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(params.token)}`;
    // TODO: Integrate with real email provider.
    // For now, log to server console for debugging in non-production environments.
    if (process.env['NODE_ENV'] !== 'production') {
      // eslint-disable-next-line no-console
      console.info('Verification email link', { email: params.email, verifyUrl });
    }
  }

  async sendPasswordResetEmail(params: ResetEmailParams): Promise<void> {
    const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(params.token)}`;
    // TODO: Integrate with real email provider.
    if (process.env['NODE_ENV'] !== 'production') {
      // eslint-disable-next-line no-console
      console.info('Password reset email link', { email: params.email, resetUrl });
    }
  }
}
