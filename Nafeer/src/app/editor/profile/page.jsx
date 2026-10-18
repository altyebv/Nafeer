import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import ProfilePage from '@/components/editor/pages/ProfilePage';

// The session token carries name/avatar/username but not the bio, so this
// one page reads the record itself.
export default async function ProfileRoute() {
  const user = await getCurrentUser();
  let record = null;
  if (user?.id) {
    await connectDB();
    record = await Contributor.findById(user.id).select('name username subject avatarUrl bio').lean();
  }
  const contributor = record ? {
    name: record.name, username: record.username, subject: record.subject,
    avatarUrl: record.avatarUrl || null, bio: record.bio || '',
  } : user;
  return <ProfilePage contributor={contributor} />;
}
