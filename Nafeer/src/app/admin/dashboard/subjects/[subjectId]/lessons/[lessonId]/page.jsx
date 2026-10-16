'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { AdminFrame, ScreenBody } from '../../../../screens/AdminFrame';
import { AdminEditorWorkspace } from '../../../../components/AdminEditorWorkspace';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';

// A lesson opened from the subject page, on its own URL so it can be linked,
// refreshed and opened in a new tab. "Back" returns to the subject page.
export default function Page({ params }) {
  const { subjectId, lessonId } = use(params);
  const router = useRouter();
  const back = () => router.push(`/admin/dashboard/subjects/${subjectId}`);
  return (
    <AdminFrame section="subjects">
      <ScreenBody>
        <div className="pt-6">
          <AdminEditorWorkspace
            subjectId={subjectId}
            subjectMeta={{ nameAr: SUBJECTS_BY_ID[subjectId]?.nameAr, source: 'atlas' }}
            initialLessonId={lessonId}
            onExit={back}
          />
        </div>
      </ScreenBody>
    </AdminFrame>
  );
}
