import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/dal';
import { ProfileForm } from '../profile-form';
import { updateProfile } from '@/actions/profile';

export const metadata = {
  title: 'Edit Profile — AI Student Companion',
  description: 'Update your academic profile',
};

export default async function EditProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Pre-fill with existing user data
  const initialData = {
    name: user.name,
    institution: user.institution,
    major: user.major,
    gradeLevel: user.gradeLevel,
    targetGpa: user.targetGpa,
    bio: user.bio,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <ProfileForm action={updateProfile} initialData={initialData} />
    </div>
  );
}
