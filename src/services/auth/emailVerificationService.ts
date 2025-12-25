import { UserRepository } from '@/repositories/userRepository';
import { VerificationTokenRepository } from '@/repositories/verificationTokenRepository';
import { TokenService } from '@/services/auth/tokenService';

export class EmailVerificationService {
  private readonly tokenService: TokenService;

  constructor(
    private readonly userRepo = new UserRepository(),
    tokenRepo = new VerificationTokenRepository()
  ) {
    this.tokenService = new TokenService(tokenRepo);
  }

  async verifyEmail(token: string): Promise<{ accountState: 'active' }> {
    const record = await this.tokenService.consumeToken(token, 'email_verify');
    if (!record) {
      throw new Error('Invalid or expired verification link');
    }

    await this.userRepo.updateEmailVerifiedAndAccountStateActive(record.userId);
    return { accountState: 'active' };
  }
}
