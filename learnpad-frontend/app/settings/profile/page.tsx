import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server-auth';
import { getProfile } from '@/lib/api/user';
import { ProfileForm } from '@/components/settings/profile-form';
import { LogoutButton } from '@/components/auth/logout-button';

/**
 * User settings page - allows users to manage their profile settings
 */
export default async function ProfileSettingsPage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  try {
    const profileData = await getProfile();

    return (
      <main className="min-h-screen bg-primary">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <h1 className="text-2xl font-bold mb-4 text-primary">
            Profile Settings
          </h1>
          <div className="bg-secondary border border-color rounded-md p-4 mb-4">
            <ProfileForm
              user={profileData.user}
              settings={profileData.settings}
            />
          </div>
          <div className="border-t border-color pt-lg">
            <LogoutButton />
          </div>
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main className="min-h-screen bg-primary">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1 text-primary">
              Error Loading Profile
            </h1>
            <p className="text-sm text-secondary">
              Unable to load your profile. Please try again later.
            </p>
          </div>
        </div>
      </main>
    );
  }
}

