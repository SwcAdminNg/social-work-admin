import { ProfilePictureCard } from "@/components/settings/ProfilePictureCard";
import { UserProfileForm } from "@/components/settings/UserProfileForm";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Your profile</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Manage your personal details and profile photo.
        </p>
      </div>

      <ProfilePictureCard />
      <UserProfileForm />
    </div>
  );
}
