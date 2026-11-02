import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pageMetadata } from '@/lib/seo';
import PrivacyPolicyContent from './PrivacyPolicyContent';

export const metadata = pageMetadata({
  title: 'سياسة الخصوصية — بشير',
  description: 'سياسة خصوصية تطبيق بشير باللغتين العربية والإنجليزية.',
  path: '/privacy',
  absoluteTitle: true,
});

export default async function PrivacyPage() {
  const policyPath = path.join(process.cwd(), 'public', 'privacy.txt');
  const policy = await readFile(policyPath, 'utf8');
  const englishStart = policy.search(/^# Privacy Policy\s*$/m);

  if (englishStart < 0) {
    throw new Error(`English policy section not found in ${policyPath}`);
  }

  const arabic = policy.slice(0, englishStart).trim();
  const english = policy.slice(englishStart).trim();

  if (!arabic || !english) {
    throw new Error(`Arabic or English policy section is empty in ${policyPath}`);
  }

  return <PrivacyPolicyContent arabic={arabic} english={english} />;
}
