export interface SettingsResponse {
  email: string;
  legalName?: string | null;
  emailNotificationsEnabled: boolean;
  marketingEmailsEnabled: boolean;
  platformUpdatesEnabled: boolean;
  isDiscoverable: boolean;
  showLocation: boolean;
}

export type UpdateSettingsPayload = Partial<
  Pick<
    SettingsResponse,
    | 'emailNotificationsEnabled'
    | 'marketingEmailsEnabled'
    | 'platformUpdatesEnabled'
    | 'isDiscoverable'
    | 'showLocation'
  >
>;
