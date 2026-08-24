import { UserProfileForm } from "@/components/settings/UserProfileForm";
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account settings and preferences.</p>
      </div>

      <UserProfileForm />
      <TwoFactorSettings />
    </div>
  );
}
