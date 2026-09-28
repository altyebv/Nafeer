import { getCurrentUser } from '@/lib/auth';
import QuizBankPage from '@/components/editor/pages/QuizBankPage';

export default async function QuizBankRoute() {
  const contributor = await getCurrentUser();
  return <QuizBankPage subjectId={contributor?.subject} />;
}
