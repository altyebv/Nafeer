'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import EditorPage from '@/components/editor/layout/EditorPage';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { Button, Card, Field, PageHeader, SaveStatus, Textarea } from '@/components/ui';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';

// ─── /editor/profile ──────────────────────────────────────────────────────────
// The contributor's own settings: the photo (same cropper as onboarding, saved
// the moment it is cropped), the bio, and the public profile link. The
// username is shown, not edited — people share that link.
//
// After a save the server re-issues the session cookie; router.refresh() makes
// the editor chrome (sidebar avatar) pick it up without a reload.

export default function ProfilePage({ contributor }) {
  const router = useRouter();
  const [avatar, setAvatar] = useState(contributor?.avatarUrl || null);
  const [photoState, setPhotoState] = useState('idle');
  const [photoError, setPhotoError] = useState('');
  const [bio, setBio] = useState(contributor?.bio || '');
  const [savedBio, setSavedBio] = useState(contributor?.bio || '');
  const [bioState, setBioState] = useState('idle');

  const subject = SUBJECTS_BY_ID[contributor?.subject]?.nameAr;
  const profileHref = contributor?.username ? `/contributor/${encodeURIComponent(contributor.username)}` : null;

  const savePhoto = async (blob, url) => {
    const previous = avatar;
    setAvatar(url);
    setPhotoError('');
    setPhotoState('saving');
    try {
      let res;
      if (blob) {
        const fd = new FormData();
        fd.append('file', blob, blob.type === 'image/webp' ? 'avatar.webp' : 'avatar.jpg');
        res = await fetch('/api/contributors/me/avatar', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/contributors/me/avatar', { method: 'DELETE' });
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j.error || 'تعذّر حفظ الصورة');
      setPhotoState('saved');
      router.refresh();
    } catch (e) {
      setAvatar(previous);
      setPhotoState('error');
      setPhotoError(e.message);
    }
  };

  const saveBio = async () => {
    setBioState('saving');
    try {
      const res = await fetch('/api/contributors/me', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bio }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error();
      setSavedBio(j.data?.bio ?? bio);
      setBioState('saved');
      router.refresh();
    } catch {
      setBioState('error');
    }
  };

  const bioDirty = bio.trim() !== (savedBio || '').trim();

  return (
    <EditorPage width="prose" className="flex flex-col gap-6 font-ui">
      <PageHeader title="ملفي" description="ما يراه الطلاب والمساهمون عنك: صورتك ونبذتك على ملفك العام وبجانب كل درس تكتبه." />

      <Card title="الصورة الشخصية" actions={<SaveStatus state={photoState} />}>
        <AvatarPicker name={contributor?.name} value={avatar} onChange={savePhoto} />
        {photoError && <p role="alert" className="mt-3 t-label text-danger">{photoError}</p>}
      </Card>

      <Card title="نبذة قصيرة" actions={<SaveStatus state={bioDirty ? 'dirty' : bioState} />}>
        <Field label="نبذة" hint={`${bio.length} / 280 — تظهر في ملفك العام.`}>
          <Textarea rows={3} maxLength={280} value={bio} onChange={(e) => { setBio(e.target.value); setBioState('idle'); }}
            placeholder="مثلاً: طالبة فيزياء في جامعة البحر الأحمر" />
        </Field>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={saveBio} loading={bioState === 'saving'} disabled={!bioDirty}>احفظ النبذة</Button>
        </div>
      </Card>

      <Card title="ملفك العام">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 t-label">
          <dt className="text-fg-muted">الاسم</dt>
          <dd className="text-fg-strong">{contributor?.name}</dd>
          {subject && (<><dt className="text-fg-muted">المادة</dt><dd className="text-fg-strong">{subject}</dd></>)}
          <dt className="text-fg-muted">الرابط</dt>
          <dd dir="ltr" className="text-right text-fg-strong break-all">{profileHref ? `/contributor/${contributor.username}` : '—'}</dd>
        </dl>
        <p className="mt-3 t-caption text-fg-subtle">الاسم والرابط ثابتان لأن الناس يشاركونهما. لتغيير أحدهما راسل الإدارة.</p>
        {profileHref && (
          <div className="mt-4">
            <Button as={Link} href={profileHref} variant="secondary" icon={ExternalLink} target="_blank">افتح ملفك العام</Button>
          </div>
        )}
      </Card>
    </EditorPage>
  );
}
