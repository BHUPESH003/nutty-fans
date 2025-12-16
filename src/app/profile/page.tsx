import { AppShellContainer } from '@/components/containers/layout/AppShellContainer';
import { MyProfilePageContainer } from '@/components/containers/profile/MyProfilePageContainer';

export default function ProfilePage() {
  return (
    <AppShellContainer>
      <MyProfilePageContainer />
    </AppShellContainer>
  );
}
