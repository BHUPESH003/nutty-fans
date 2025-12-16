import crypto from 'crypto';

const HIBP_API_ROOT = 'https://api.pwnedpasswords.com/range';

export async function isPasswordPwned(password: string): Promise<boolean> {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const enabled = process.env['HIBP_ENABLED'] === 'true';
  if (!enabled) return false;

  const res = await fetch(`${HIBP_API_ROOT}/${prefix}`);
  if (!res.ok) {
    // Fail open: log and treat as not pwned to avoid blocking users when HIBP is down.
    if (process.env['NODE_ENV'] !== 'production') {
      console.warn('HIBP request failed', res.status);
    }
    return false;
  }

  const body = await res.text();
  const lines = body.split('\n');
  for (const line of lines) {
    const [hashSuffix] = line.trim().split(':');
    if (hashSuffix === suffix) {
      return true;
    }
  }

  return false;
}
