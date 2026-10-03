import { UserProfileForm } from "@/components/settings/UserProfileForm";
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account settings and preferences.</p>
      </div>

      <UserProfileForm />
      <TwoFactorSettings />
    </div>
  );
}
