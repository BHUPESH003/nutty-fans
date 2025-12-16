import type {
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
  ResendVerificationPayload,
  ResendVerificationResponse,
  SimpleMessageResponse,
  VerifyEmailPayload,
  VerifyEmailResponse,
} from '@/types/auth';
import type {
  AvatarUploadUrlPayload,
  AvatarUploadUrlResponse,
  ConfirmAvatarPayload,
  GetMyProfileResponse,
  GetPublicProfileResponse,
  UpdateProfilePayload,
} from '@/types/profile';
import type { SettingsResponse, UpdateSettingsPayload } from '@/types/settings';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

class ApiError extends Error {
  code?: string;
  status: number;
  details?: unknown;

  constructor(status: number, code: string | undefined, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<TResponse>(
  path: string,
  options: { method?: HttpMethod; body?: unknown; signal?: AbortSignal } = {}
): Promise<TResponse> {
  const { method = 'GET', body, signal } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    signal,
  });

  let parsed: ApiErrorPayload | TResponse | null = null;
  const hasBody = response.status !== 204;

  if (hasBody) {
    try {
      parsed = (await response.json()) as ApiErrorPayload | TResponse;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const errPayload = parsed as ApiErrorPayload | null;
    const code = errPayload?.error?.code;
    const message = errPayload?.error?.message || 'Something went wrong. Please try again later.';

    throw new ApiError(response.status, code, message, errPayload?.error?.details);
  }

  return parsed as TResponse;
}

async function getCurrentUser(): Promise<AuthUser> {
  const data = await request<{ id: string } & Partial<AuthUser>>('/api/users/me');
  return {
    id: data.id,
    email: data.email ?? '',
    displayName: data.displayName,
    username: data.username,
    role: data.role,
    accountState: data.accountState,
    ageStatus: data.ageStatus ?? null,
  };
}

export const apiClient = {
  auth: {
    register(payload: RegisterPayload) {
      return request<RegisterResponse>('/api/auth/register', {
        method: 'POST',
        body: payload,
      });
    },
    login(payload: LoginPayload) {
      return request<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: payload,
      });
    },
    logout() {
      return request<SimpleMessageResponse>('/api/auth/logout', {
        method: 'POST',
      });
    },
    forgotPassword(payload: ForgotPasswordPayload) {
      return request<SimpleMessageResponse>('/api/auth/forgot-password', {
        method: 'POST',
        body: payload,
      });
    },
    resetPassword(payload: ResetPasswordPayload) {
      return request<SimpleMessageResponse>('/api/auth/reset-password', {
        method: 'POST',
        body: payload,
      });
    },
    verifyEmail(payload: VerifyEmailPayload) {
      return request<VerifyEmailResponse>('/api/auth/email/verify', {
        method: 'POST',
        body: payload,
      });
    },
    resendVerification(payload: ResendVerificationPayload) {
      return request<ResendVerificationResponse>('/api/auth/resend-verification', {
        method: 'POST',
        body: payload,
      });
    },
  },
  user: {
    me: getCurrentUser,
  },
  profile: {
    me() {
      return request<GetMyProfileResponse>('/api/profile/me');
    },
    byHandle(handle: string) {
      return request<GetPublicProfileResponse>(`/api/profile/${encodeURIComponent(handle)}`);
    },
    update(payload: UpdateProfilePayload) {
      return request<GetMyProfileResponse>('/api/profile', {
        method: 'PATCH',
        body: payload,
      });
    },
    requestAvatarUpload(payload: AvatarUploadUrlPayload) {
      return request<AvatarUploadUrlResponse>('/api/profile/avatar/upload-url', {
        method: 'POST',
        body: payload,
      });
    },
    confirmAvatar(payload: ConfirmAvatarPayload) {
      return request<{ avatarUrl: string }>('/api/profile/avatar/confirm', {
        method: 'POST',
        body: payload,
      });
    },
    removeAvatar() {
      return request<void>('/api/profile/avatar', {
        method: 'DELETE',
      });
    },
  },
  settings: {
    get() {
      return request<SettingsResponse>('/api/settings');
    },
    update(payload: UpdateSettingsPayload) {
      return request<SettingsResponse>('/api/settings', {
        method: 'PATCH',
        body: payload,
      });
    },
  },
  age: {
    /**
     * Age status is derived from the current user response.
     * Backend owns exact semantics; frontend only reflects status.
     */
    async getStatus() {
      const user = await getCurrentUser();

      return {
        accountState: user.accountState ?? 'active',
        ageStatus: user.ageStatus ?? null,
      };
    },
    /**
     * Initiate age verification with the provider.
     * Endpoint path must match backend implementation.
     */
    startVerification() {
      return request<{ redirectUrl: string }>('/age/verify/initiate', {
        method: 'POST',
      });
    },
  },
};

export type ApiClient = typeof apiClient;
export { ApiError };
