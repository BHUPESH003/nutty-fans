import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import { toast } from '@/hooks/use-toast';
import type { ApiResponse } from '@/lib/api/response';
import {
  isInsufficientBalanceError,
  isInsufficientBalanceStatus,
} from '@/lib/constants/errorCodes';
import { getGlobalLowBalanceHandler } from '@/lib/contexts/LowBalanceContext';
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
import type { CreatorStatusResponse } from '@/types/creator';
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

export class ApiError extends Error {
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

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for NextAuth sessions
});

// Request interceptor - can be used for auth headers, logging, etc.
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add any request-level logic here (e.g., auth tokens, request ID)
    // Since we're using NextAuth with cookies, no need to add auth headers manually
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles standardized { code, data, message } response format
axiosInstance.interceptors.response.use(
  (response) => {
    // Extract the ApiResponse wrapper
    const apiResponse = response.data as ApiResponse<unknown>;
    const requestMethod = (response.config.method || '').toUpperCase();

    // Check if response follows our standard format
    if (apiResponse && typeof apiResponse === 'object' && 'code' in apiResponse) {
      // Success case: code is 2xx
      if (apiResponse.code >= 200 && apiResponse.code < 300) {
        // Show success toast for mutation operations (POST, PATCH, DELETE, PUT)
        if (
          typeof window !== 'undefined' &&
          ['POST', 'PATCH', 'DELETE', 'PUT'].includes(requestMethod)
        ) {
          // Only show toast if there's a message
          if (apiResponse.message && apiResponse.message !== 'Success') {
            toast({
              title: 'Success',
              description: apiResponse.message,
            });
          }
        }

        // Replace response.data with the extracted data payload
        response.data = apiResponse.data;
        return response;
      }

      // Error case: code is not 2xx
      // Extract errorCode from data if available
      const errorCode =
        apiResponse.data && typeof apiResponse.data === 'object' && 'errorCode' in apiResponse.data
          ? (apiResponse.data as { errorCode?: string }).errorCode
          : undefined;

      // Throw ApiError to be caught by error handler
      const apiError = new ApiError(
        apiResponse.code,
        errorCode,
        apiResponse.message || 'An error occurred',
        apiResponse.data
      );

      // Handle error toasts and low balance modal (only in browser)
      if (typeof window !== 'undefined') {
        handleApiError(apiError, apiResponse.code);
      }

      throw apiError;
    }

    // If response doesn't follow our format, return as-is (for backward compatibility)
    return response;
  },
  (error: AxiosError) => {
    // Handle axios errors (network errors, non-2xx HTTP status, etc.)
    if (error.response) {
      // Server responded with error status
      const apiResponse = error.response.data as ApiResponse<unknown> | undefined;

      if (apiResponse && typeof apiResponse === 'object' && 'code' in apiResponse) {
        // Standardized error format
        const errorCode =
          apiResponse.data &&
          typeof apiResponse.data === 'object' &&
          'errorCode' in apiResponse.data
            ? (apiResponse.data as { errorCode?: string }).errorCode
            : undefined;

        const apiError = new ApiError(
          apiResponse.code,
          errorCode,
          apiResponse.message || 'An error occurred',
          apiResponse.data
        );

        // Handle error toasts and low balance modal (only in browser)
        if (typeof window !== 'undefined') {
          handleApiError(apiError, apiResponse.code);
        }

        throw apiError;
      }

      // Non-standard error format - use HTTP status
      const apiError = new ApiError(
        error.response.status,
        'UNKNOWN_ERROR',
        error.message || 'Something went wrong. Please try again later.',
        error.response.data
      );

      if (typeof window !== 'undefined') {
        handleApiError(apiError, error.response.status);
      }
      throw apiError;
    }

    // Network error or request was cancelled
    if (error.request) {
      const apiError = new ApiError(
        0,
        'NETWORK_ERROR',
        'Network error. Please check your connection and try again.',
        null
      );

      if (typeof window !== 'undefined') {
        toast({
          title: 'Network Error',
          description: 'Please check your connection and try again.',
          variant: 'destructive',
        });
      }

      throw apiError;
    }

    // Something else happened
    const apiError = new ApiError(
      500,
      'UNKNOWN_ERROR',
      error.message || 'An unexpected error occurred',
      null
    );

    if (typeof window !== 'undefined') {
      handleApiError(apiError, 500);
    }
    throw apiError;
  }
);

/**
 * Centralized error handling for API errors
 * Shows toasts and triggers low balance modal when appropriate
 */
function handleApiError(error: ApiError, statusCode: number) {
  // Check for insufficient balance
  const isLowBalance =
    isInsufficientBalanceError(error.code) || isInsufficientBalanceStatus(statusCode);

  if (isLowBalance) {
    // Try to extract balance details from error details
    const details = error.details as
      | { requiredAmount?: number; currentBalance?: number }
      | undefined;
    const requiredAmount = details?.requiredAmount;
    const currentBalance = details?.currentBalance;

    // Trigger low balance modal via global handler
    const showLowBalanceModal = getGlobalLowBalanceHandler();
    if (showLowBalanceModal) {
      showLowBalanceModal(error.message, requiredAmount, currentBalance);
    }

    // Also show a toast
    toast({
      title: 'Insufficient Balance',
      description: error.message || 'Please add funds to your wallet to continue.',
      variant: 'destructive',
    });
  } else {
    // Show generic error toast for other errors
    toast({
      title: 'Error',
      description: error.message || 'Something went wrong. Please try again.',
      variant: 'destructive',
    });
  }
}

/**
 * Generic request function using axios
 * Automatically handles { code, data, message } response format via interceptors
 */
export async function request<TResponse>(
  path: string,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const response = await axiosInstance.request<TResponse>({
    url: path,
    ...config,
  });
  // Response interceptor returns response object with data already extracted
  return response.data as TResponse;
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
        data: payload,
      });
    },
    login(payload: LoginPayload) {
      return request<LoginResponse>('/api/auth/login', {
        method: 'POST',
        data: payload,
      });
    },
    logout() {
      return request<SimpleMessageResponse>('/api/auth/logout', {
        method: 'POST',
      });
    },
    /**
     * NextAuth session (non-standard response shape; returned as-is)
     */
    getSession() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>('/api/auth/session');
    },
    forgotPassword(payload: ForgotPasswordPayload) {
      return request<SimpleMessageResponse>('/api/auth/forgot-password', {
        method: 'POST',
        data: payload,
      });
    },
    resetPassword(payload: ResetPasswordPayload) {
      return request<SimpleMessageResponse>('/api/auth/reset-password', {
        method: 'POST',
        data: payload,
      });
    },
    verifyEmail(payload: VerifyEmailPayload) {
      return request<VerifyEmailResponse>('/api/auth/email/verify', {
        method: 'POST',
        data: payload,
      });
    },
    resendVerification(payload: ResendVerificationPayload) {
      return request<ResendVerificationResponse>('/api/auth/resend-verification', {
        method: 'POST',
        data: payload,
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
        data: payload,
      });
    },
    requestAvatarUpload(payload: AvatarUploadUrlPayload) {
      return request<AvatarUploadUrlResponse>('/api/profile/avatar/upload-url', {
        method: 'POST',
        data: payload,
      });
    },
    confirmAvatar(payload: ConfirmAvatarPayload) {
      return request<{ avatarUrl: string }>('/api/profile/avatar/confirm', {
        method: 'POST',
        data: payload,
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
        data: payload,
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
          data: payload,
        }
      );
    },
    getStatus() {
      return request<CreatorStatusResponse | null>('/api/creator/status');
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
    getProfile() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>('/api/creator/profile');
    },
    updateProfile(payload: {
      bio?: string;
      categoryId?: string;
      coverImageUrl?: string;
      socialLinks?: Record<string, string>;
      blockedCountries?: string[];
    }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>('/api/creator/profile', {
        method: 'PATCH',
        data: payload,
      });
    },
    updateSubscription(payload: {
      subscriptionPrice: number;
      subscriptionPrice3m: number | null;
      subscriptionPrice6m: number | null;
      subscriptionPrice12m: number | null;
      freeTrialDays: number;
    }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>('/api/creator/subscription', {
        method: 'PATCH',
        data: payload,
      });
    },
    getSquareConnectUrl() {
      return request<{ url: string }>('/api/creator/square/connect');
    },
    getSquareStatus() {
      return request<{ isConnected: boolean }>('/api/creator/square/status');
    },
    syncKycStatus() {
      return request<{ updated: boolean; message?: string }>('/api/creator/kyc/sync', {
        method: 'POST',
      });
    },
    submitEligibility(payload: {
      ageConfirmed: boolean;
      country: string;
      contentTypeIntent: string;
    }) {
      return request<{ nextStep: string }>('/api/creator/apply/eligibility', {
        method: 'POST',
        data: payload,
      });
    },
    submitCategory(payload: { categoryId: string; creatorGoal: string; secondaryTags?: string[] }) {
      return request<{ nextStep: string }>('/api/creator/apply/category', {
        method: 'POST',
        data: payload,
      });
    },
    submitProfile(payload: {
      displayName: string;
      username: string;
      bio: string;
      avatarUrl?: string;
      socialLinks?: Record<string, string>;
    }) {
      return request<{ nextStep: string }>('/api/creator/apply/profile', {
        method: 'POST',
        data: payload,
      });
    },
    submitPricing(payload: { subscriptionPrice: number; freeTrialDays: number }) {
      return request<{ nextStep: string }>('/api/creator/apply/pricing', {
        method: 'POST',
        data: payload,
      });
    },
    submitReview() {
      return request<{ nextStep: string }>('/api/creator/apply/submit-review', {
        method: 'POST',
      });
    },
    getPublicProfile(handle: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/public/creator/${encodeURIComponent(handle)}`);
    },
    getPublicPosts(handle: string, cursor?: string) {
      const searchParams = new URLSearchParams();
      if (cursor) searchParams.append('cursor', cursor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(
        `/api/public/creator/${encodeURIComponent(handle)}/posts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      );
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
        data: data,
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
    listMyPosts(params?: {
      status?: 'draft' | 'published' | 'scheduled';
      cursor?: string;
      limit?: number;
    }) {
      const sp = new URLSearchParams();
      if (params?.status) sp.append('status', params.status);
      if (params?.cursor) sp.append('cursor', params.cursor);
      if (params?.limit) sp.append('limit', params.limit.toString());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/posts${sp.toString() ? `?${sp.toString()}` : ''}`);
    },
    toggleLike(postId: string) {
      return request<{ isLiked: boolean }>(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
    },
    toggleBookmark(postId: string) {
      return request<{ isBookmarked: boolean }>(`/api/posts/${postId}/bookmark`, {
        method: 'POST',
      });
    },
    getUploadUrl(filename: string, contentType: string, size: number) {
      return request<{ uploadUrl: string; mediaId: string; key: string }>('/api/media/upload-url', {
        method: 'POST',
        data: { filename, contentType, size },
      });
    },
    confirmUpload(mediaId: string, key: string, dimensions?: { width?: number; height?: number }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>('/api/media/confirm', {
        method: 'POST',
        data: { mediaId, key, ...dimensions },
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
        data: { participantId },
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
        data: { content, mediaId, price },
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
  tags: {
    list(params?: { q?: string; limit?: number }) {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.append('q', params.q);
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      return request<{
        tags: Array<{ id: string; name: string; slug: string; usageCount: number }>;
      }>(`/api/tags${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
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
        data: subscription,
      });
    },
    async unsubscribe(endpoint: string) {
      return request<{ success: boolean }>('/api/push/unsubscribe', {
        method: 'POST',
        data: { endpoint },
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
      return request<{ checkoutUrl: string; checkoutId: string }>('/api/wallet/topup', {
        method: 'POST',
        data: { amount },
      });
    },
  },
  payments: {
    getStatus() {
      return request<{ walletBalance: number; autoTopUpEnabled: boolean }>('/api/payments/status');
    },
    /**
     * Unlock PPV content - debits wallet
     * Uses the correct purchase endpoint which performs actual transaction
     */
    unlockPpv(postId: string) {
      return request<{ data: { purchase: { id: string }; transactionId: string } }>(
        `/api/ppv/${postId}/purchase`,
        {
          method: 'POST',
          data: { paymentSource: 'wallet' },
        }
      );
    },
    /**
     * Subscribe to a creator - debits wallet
     */
    subscribe(
      creatorId: string,
      planType: 'monthly' | '3month' | '6month' | '12month' = 'monthly'
    ) {
      return request<{ data: { subscriptionId: string; expiresAt: string } }>(
        '/api/subscriptions',
        {
          method: 'POST',
          data: { creatorId, planType },
        }
      );
    },
    /**
     * Send a tip to a creator
     */
    sendTip(input: {
      creatorId: string;
      amount: number;
      message?: string;
      paymentSource?: 'wallet' | 'card';
    }) {
      return request<{ data: { tipId: string; transactionId: string } }>('/api/tips', {
        method: 'POST',
        data: {
          creatorId: input.creatorId,
          amount: input.amount,
          message: input.message,
          paymentSource: input.paymentSource || 'wallet',
        },
      });
    },
  },
  subscriptions: {
    subscribe(
      creatorId: string,
      planType: 'monthly' | '3month' | '6month' | '12month' = 'monthly'
    ) {
      return request<{ data: { subscriptionId: string; expiresAt: string } }>(
        '/api/subscriptions',
        {
          method: 'POST',
          data: { creatorId, planType },
        }
      );
    },
    list(cursor?: string) {
      const searchParams = new URLSearchParams();
      if (cursor) searchParams.append('cursor', cursor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(
        `/api/subscriptions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      );
    },
    cancel(subscriptionId: string) {
      return request<{ success: boolean }>(`/api/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        data: { action: 'cancel' },
      });
    },
  },
  ppv: {
    listPurchases(cursor?: string, limit?: number) {
      const searchParams = new URLSearchParams();
      if (cursor) searchParams.append('cursor', cursor);
      if (limit) searchParams.append('limit', limit.toString());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(
        `/api/ppv/purchases${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      );
    },
  },
  bundles: {
    listMy(cursor?: string) {
      const sp = new URLSearchParams();
      if (cursor) sp.append('cursor', cursor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/bundles${sp.toString() ? `?${sp.toString()}` : ''}`);
    },
    create(input: {
      title: string;
      description?: string;
      price: number;
      originalPrice?: number | null;
      coverImageUrl?: string | null;
      postIds?: string[];
    }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>('/api/bundles', { method: 'POST', data: input });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update(bundleId: string, input: any) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/bundles/${bundleId}`, { method: 'PATCH', data: input });
    },
    getMy(bundleId: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/bundles/${bundleId}`);
    },
    setItems(bundleId: string, postIds: string[]) {
      return request<{ itemCount: number }>(`/api/bundles/${bundleId}/items`, {
        method: 'PUT',
        data: { postIds },
      });
    },
    activate(bundleId: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/bundles/${bundleId}/activate`, { method: 'POST' });
    },
    purchase(bundleId: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/bundles/${bundleId}/purchase`, { method: 'POST' });
    },
    listPurchases(cursor?: string) {
      const sp = new URLSearchParams();
      if (cursor) sp.append('cursor', cursor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/bundles/purchases${sp.toString() ? `?${sp.toString()}` : ''}`);
    },
    listPublicByHandle(handle: string, cursor?: string) {
      const sp = new URLSearchParams();
      if (cursor) sp.append('cursor', cursor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(
        `/api/public/creator/${encodeURIComponent(handle)}/bundles${sp.toString() ? `?${sp.toString()}` : ''}`
      );
    },
  },
  streams: {
    create(input: {
      title: string;
      description?: string;
      thumbnailUrl?: string | null;
      accessLevel: 'free' | 'subscribers' | 'paid';
      entryPrice?: number | null;
      scheduledAt?: string | null;
    }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>('/api/streams', { method: 'POST', data: input });
    },
    listLive(cursor?: string) {
      const sp = new URLSearchParams();
      if (cursor) sp.append('cursor', cursor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/streams/live${sp.toString() ? `?${sp.toString()}` : ''}`);
    },
    get(streamId: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/streams/${streamId}`);
    },
    start(streamId: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/streams/${streamId}/start`, { method: 'POST' });
    },
    end(streamId: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/streams/${streamId}/end`, { method: 'POST' });
    },
    purchase(streamId: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/streams/${streamId}/purchase`, { method: 'POST' });
    },
    getPlayback(streamId: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/streams/${streamId}/playback`);
    },
    listMine() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>('/api/creator/live-streams');
    },
    getCreatorStream(streamId: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return request<any>(`/api/creator/live-streams/${encodeURIComponent(streamId)}`);
    },
  },
};

export type ApiClient = typeof apiClient;
