import { AppShellContainer } from '@/components/containers/layout/AppShellContainer';
import { SettingsPageContainer } from '@/components/containers/settings/SettingsPageContainer';

export default function SettingsPage() {
  return (
    <AppShellContainer>
      <SettingsPageContainer />
    </AppShellContainer>
  );
}
