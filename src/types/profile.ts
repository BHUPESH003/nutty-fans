export interface Profile {
  id: string;
  displayName: string;
  username: string;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  joinDate: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isDiscoverable: boolean;
  showLocation: boolean;
}

export type GetMyProfileResponse = Profile;
export type GetPublicProfileResponse = Profile;

export interface UpdateProfilePayload {
  displayName?: string;
  bio?: string | null;
  location?: string | null;
  isDiscoverable?: boolean;
  showLocation?: boolean;
}

export interface AvatarUploadUrlPayload {
  filename: string;
  contentType: string;
  fileSize: number;
}

export interface AvatarUploadUrlResponse {
  uploadUrl: string;
  avatarKey: string;
}

export interface ConfirmAvatarPayload {
  avatarKey: string;
}
