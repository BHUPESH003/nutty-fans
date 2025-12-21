import type { ApiResponse } from '@/lib/api/response';
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

// ... (imports)

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

  let parsed: ApiResponse<TResponse> | null = null;
  const hasBody = response.status !== 204;

  if (hasBody) {
    try {
      parsed = (await response.json()) as ApiResponse<TResponse>;
    } catch {
      parsed = null;
    }
  }

  // Handle network/server errors that don't return our standard format
  if (!response.ok && !parsed) {
    throw new ApiError(
      response.status,
      'UNKNOWN_ERROR',
      'Something went wrong. Please try again later.'
    );
  }

  // Handle standardized errors (even if HTTP status is 200, though usually it matches)
  if (parsed && (parsed.code < 200 || parsed.code >= 300)) {
    throw new ApiError(parsed.code, 'API_ERROR', parsed.message, parsed.data);
  }

  // Return the data payload directly
  return parsed?.data as TResponse;
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
  creator: {
    apply(payload: { bio: string; categoryId: string; subscriptionPrice: number }) {
      return request<{ creatorProfileId: string; status: string; nextStep: string }>(
        '/api/creator/apply',
        {
          method: 'POST',
          body: payload,
        }
      );
    },
    getStatus() {
      return request<{
        status: 'pending_kyc' | 'kyc_in_progress' | 'pending_payout_setup' | 'active';
        kycStatus: string;
        isSquareConnected: boolean;
        isVerified: boolean;
        nextStep: string | null;
      } | null>('/api/creator/status');
    },
    startKyc() {
      return request<{ sessionUrl: string; sessionId: string }>('/api/creator/kyc/start', {
        method: 'POST',
      });
    },
    getDashboard() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>('/api/creator/dashboard');
    },
  },
  common: {
    getCategories() {
      return request<{ id: string; name: string; slug: string; icon: string | null }[]>(
        '/api/categories'
      );
    },
  },
  content: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createPost(data: any) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>('/api/posts', {
        method: 'POST',
        body: data,
      });
    },
    getFeed(params?: { cursor?: string; limit?: number; type?: 'for-you' | 'following' }) {
      const searchParams = new URLSearchParams();
      if (params?.cursor) searchParams.append('cursor', params.cursor);
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.type) searchParams.append('type', params.type);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/posts/feed?${searchParams.toString()}`);
    },
    getPost(id: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/posts/${id}`);
    },
    getUploadUrl(filename: string, contentType: string, size: number) {
      return request<{ uploadUrl: string; mediaId: string; key: string }>('/api/media/upload-url', {
        method: 'POST',
        body: { filename, contentType, size },
      });
    },
    confirmUpload(mediaId: string, key: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/media/confirm/${mediaId}`, {
        method: 'POST',
        body: { key },
      });
    },
  },
  messaging: {
    listConversations(cursor?: string) {
      const searchParams = new URLSearchParams();
      if (cursor) searchParams.append('cursor', cursor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<{ items: any[]; nextCursor?: string }>(
        `/api/conversations${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      );
    },
    getConversation(id: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/conversations/${id}`);
    },
    createConversation(participantId: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>('/api/conversations', {
        method: 'POST',
        body: { participantId },
      });
    },
    listMessages(conversationId: string, cursor?: string) {
      const searchParams = new URLSearchParams();
      if (cursor) searchParams.append('cursor', cursor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<{ items: any[]; nextCursor?: string }>(
        `/api/conversations/${conversationId}/messages${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      );
    },
    sendMessage(conversationId: string, content: string | null, mediaId?: string, price?: number) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: { content, mediaId, price },
      });
    },
    unlockMessage(messageId: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/messages/${messageId}/unlock`, {
        method: 'POST',
      });
    },
    markConversationRead(conversationId: string) {
      return request<{ success: boolean }>(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
      });
    },
  },
  notifications: {
    list(cursor?: string) {
      const searchParams = new URLSearchParams();
      if (cursor) searchParams.append('cursor', cursor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<{ items: any[]; nextCursor?: string }>(
        `/api/notifications${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      );
    },
    getUnreadCount() {
      return request<{ count: number }>('/api/notifications/unread-count');
    },
    markAsRead(notificationId: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
    },
    markAllAsRead() {
      return request<{ count: number }>('/api/notifications/read-all', {
        method: 'POST',
      });
    },
  },
  search: {
    search(query: string, limit?: number) {
      const searchParams = new URLSearchParams();
      searchParams.append('q', query);
      if (limit) searchParams.append('limit', limit.toString());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<{ creators: any[]; posts: any[] }>(`/api/search?${searchParams.toString()}`);
    },
    searchCreators(query: string, categoryId?: string, limit?: number) {
      const searchParams = new URLSearchParams();
      searchParams.append('q', query);
      if (categoryId) searchParams.append('categoryId', categoryId);
      if (limit) searchParams.append('limit', limit.toString());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<{ creators: any[] }>(`/api/search/creators?${searchParams.toString()}`);
    },
    getTrendingCreators(limit?: number) {
      const searchParams = new URLSearchParams();
      if (limit) searchParams.append('limit', limit.toString());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<{ creators: any[] }>(
        `/api/search/trending/creators?${searchParams.toString() || '?'}`
      );
    },
    getTrendingPosts(limit?: number) {
      const searchParams = new URLSearchParams();
      if (limit) searchParams.append('limit', limit.toString());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<{ posts: any[] }>(
        `/api/search/trending/posts?${searchParams.toString() || '?'}`
      );
    },
  },
  explore: {
    getFeed(cursor?: string, limit?: number) {
      const searchParams = new URLSearchParams();
      if (cursor) searchParams.append('cursor', cursor);
      if (limit) searchParams.append('limit', limit.toString());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/feed/explore?${searchParams.toString() || '?'}`);
    },
  },
  push: {
    async subscribe(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
      return request<{ success: boolean }>('/api/push/subscribe', {
        method: 'POST',
        body: subscription,
      });
    },
    async unsubscribe(endpoint: string) {
      return request<{ success: boolean }>('/api/push/unsubscribe', {
        method: 'POST',
        body: { endpoint },
      });
    },
    async getVapidKey() {
      return request<{ publicKey: string }>('/api/push/vapid-key');
    },
  },
  wallet: {
    getBalance() {
      return request<{ balance: number; currency: string }>('/api/wallet');
    },
    getTransactions(cursor?: string) {
      const searchParams = new URLSearchParams();
      if (cursor) searchParams.append('cursor', cursor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<{ transactions: any[]; nextCursor?: string }>(
        `/api/wallet/transactions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      );
    },
    topup(amount: number) {
      return request<{ transactionId: string; balance: number }>('/api/wallet/topup', {
        method: 'POST',
        body: { amount },
      });
    },
  },
};

export type ApiClient = typeof apiClient;
export { ApiError };
