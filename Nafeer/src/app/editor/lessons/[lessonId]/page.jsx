import { getCurrentUser } from '@/lib/auth';
import LessonEditorPage from '@/components/editor/lesson/LessonEditorPage';

export default async function LessonEditorRoute({ params }) {
  const { lessonId } = await params;
  const contributor  = await getCurrentUser();

  return (
    <LessonEditorPage
      lessonId={decodeURIComponent(lessonId)}
      subjectId={contributor?.subject}
      currentUser={contributor}
    />
  );
}
