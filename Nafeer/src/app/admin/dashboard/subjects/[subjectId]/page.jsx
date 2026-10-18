'use client';
import { use } from 'react';
import { AdminFrame } from '../../screens/AdminFrame';
import { SubjectPage } from '../../screens/SubjectPage';

export default function Page({ params }) {
  const { subjectId } = use(params);
  return (
    <AdminFrame section="subjects">
      <SubjectPage subjectId={subjectId} />
    </AdminFrame>
  );
}
