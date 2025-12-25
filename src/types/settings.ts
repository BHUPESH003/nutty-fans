export interface SettingsResponse {
  email: string;
  legalName?: string | null;
  notifications: {
    emailNotifications: boolean;
    marketingEmails: boolean;
    platformUpdates: boolean;
    pushNotifications: boolean;
  };
  privacy: {
    profileDiscoverable: boolean;
    showLocation: boolean;
  };
}

export type UpdateSettingsPayload = Partial<{
  notifications: Partial<SettingsResponse['notifications']>;
  privacy: Partial<SettingsResponse['privacy']>;
}>;
