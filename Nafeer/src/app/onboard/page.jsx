'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Field, Input, Textarea, cx } from '@/components/ui';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';
import { SITE_URL } from '@/lib/seo';
import { AvatarPicker } from '@/components/profile/AvatarPicker';

// ─── /onboard?token=… ─────────────────────────────────────────────────────────
// Account creation after approval (canvas board «حسابك ودرسك الأول"): one
// screen — a password, the public profile URL shown and editable before it
// exists, an optional photo (cropped in the browser) and bio — and it ends
// inside the first lesson nobody has started in the contributor's subject.

const USERNAME_RE = /^[\w؀-ۿ._-]{3,20}$/;
const HOST = SITE_URL.replace(/^https?:\/\//, '').replace(/\/+$/, '');

export default function OnboardPage() {
  return <Suspense fallback={null}><Onboard /></Suspense>;
}

function Onboard() {
  const router = useRouter();
  const token = useSearchParams().get('token');
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ password: '', password2: '', username: '', bio: '', subject: '' });
  const [fieldErr, setFieldErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [avatar, setAvatar] = useState({ blob: null, url: null });

  useEffect(() => {
    if (!token) { setError('لا يوجد رابط صالح في هذا العنوان.'); return; }
    fetch(`/api/auth/onboard?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) { setError(j.error || 'الرابط غير صالح'); return; }
        setInfo(j.data);
        setForm((f) => ({ ...f, username: j.data.suggestedUsername || '' }));
      })
      .catch(() => setError('تعذّر التحقق من الرابط'));
  }, [token]);

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setFieldErr({}); };

  const submit = async () => {
    const e = {};
    if (form.password.length < 8) e.password = '8 أحرف على الأقل';
    else if (form.password !== form.password2) e.password2 = 'لا تطابق كلمة المرور';
    if (!USERNAME_RE.test(form.username.trim())) e.username = '3–20 حرفاً: أحرف أو أرقام أو _ . -';
    if (info?.needsSubjectChoice && !form.subject) e.subject = 'اختر مادتك';
    if (Object.keys(e).length) { setFieldErr(e); return; }

    setBusy(true);
    try {
      const res = await fetch('/api/auth/onboard', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password, username: form.username.trim(), bio: form.bio, chosenSubject: form.subject || undefined }),
      });
      const j = await res.json();
      if (!j.ok) {
        if (j.field === 'username') setFieldErr({ username: j.error });
        else setFieldErr({ form: j.error || 'تعذّر إنشاء الحساب' });
        setBusy(false);
        return;
      }
      // The account exists and the session cookie is set: send the photo now.
      // A failed upload never blocks the way into the lesson.
      if (avatar.blob) {
        const fd = new FormData();
        fd.append('file', avatar.blob, avatar.blob.type === 'image/webp' ? 'avatar.webp' : 'avatar.jpg');
        await fetch('/api/contributors/me/avatar', { method: 'POST', body: fd }).catch(() => null);
      }
      router.push(j.firstLessonId ? `/editor/lessons/${j.firstLessonId}?welcome=1` : '/editor');
    } catch {
      setFieldErr({ form: 'تعذّر الاتصال — حاول مرة أخرى' });
      setBusy(false);
    }
  };

  const subjectId = info?.subject || form.subject || (info?.subjectsOfInterest?.length === 1 ? info.subjectsOfInterest[0] : '');
  const subjectName = SUBJECTS_BY_ID[subjectId]?.nameAr;
  const first = info?.name?.split(' ')[0];

  return (
    <div className="min-h-screen bg-page text-fg font-ui" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <Link href="/" className="t-title font-bold text-fg-accent w-fit">نفير</Link>

        {error && (
          <div className="flex flex-col gap-3 max-w-lg">
            <h1 className="t-h1 text-fg-strong">رابط غير صالح</h1>
            <p className="t-body text-fg-muted">{error}</p>
            <p className="t-label text-fg-muted">تابع طلبك من <Link href="/join/status" className="text-fg-accent hover:underline">صفحة حالة طلبك</Link>، أو ردّ على بريدنا لنرسل رابطاً جديداً.</p>
          </div>
        )}
        {!error && !info && <p className="t-body text-fg-subtle">جارٍ التحقق من الرابط…</p>}

        {info && (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="t-label text-success">✓ قُبل طلبك{subjectName ? ` · ${subjectName}` : ''}</span>
              <h1 className="t-h1 text-fg-strong">أهلاً بك يا {first}. دقيقة واحدة، ثم درسك الأول.</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
              <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
                <AvatarPicker name={info.name} value={avatar.url} onChange={(blob, url) => setAvatar({ blob, url })} />

                {info.needsSubjectChoice && (
                  <fieldset className="flex flex-col gap-2">
                    <legend className="t-label text-fg mb-1">مادتك {fieldErr.subject && <span className="text-danger ms-2">{fieldErr.subject}</span>}</legend>
                    <div className="flex flex-wrap gap-2">
                      {info.subjectsOfInterest.map((id) => (
                        <button key={id} type="button" aria-pressed={form.subject === id} onClick={() => set({ subject: id })}
                          className={cx('h-11 px-4 rounded-chip border t-label touch-target', form.subject === id ? 'border-line-accent bg-selected text-fg-accent' : 'border-line-strong text-fg hover:bg-hover')}>
                          {SUBJECTS_BY_ID[id]?.nameAr || id}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="كلمة المرور" required error={fieldErr.password} hint="8 أحرف على الأقل.">
                    <Input type="password" autoComplete="new-password" value={form.password} onChange={(e) => set({ password: e.target.value })} />
                  </Field>
                  <Field label="أعد كتابتها" required error={fieldErr.password2}>
                    <Input type="password" autoComplete="new-password" value={form.password2} onChange={(e) => set({ password2: e.target.value })} />
                  </Field>
                </div>

                <Field label="رابط ملفك العام" required error={fieldErr.username}
                  hint="يظهر عليه ما أنجزته وأين ساهمت. اختره الآن — بعدها يبقى ثابتاً لأن الناس يشاركونه.">
                  <div className="flex items-stretch rounded-control border border-line-strong bg-sunken overflow-hidden focus-within:border-accent-hover" dir="ltr">
                    <span className="flex items-center px-3 t-label text-fg-subtle bg-hover whitespace-nowrap">{HOST}/contributor/</span>
                    <input value={form.username} onChange={(e) => set({ username: e.target.value })} aria-label="اسم المستخدم"
                      className="flex-1 min-w-0 h-11 px-2 bg-transparent text-fg t-ui focus:outline-none" />
                  </div>
                </Field>

                <Field label="نبذة قصيرة" hint="اختياري — تظهر في ملفك العام.">
                  <Textarea rows={2} maxLength={280} value={form.bio} onChange={(e) => set({ bio: e.target.value })} placeholder="مثلاً: طالبة فيزياء في جامعة البحر الأحمر" />
                </Field>

                {fieldErr.form && <p role="alert" className="t-label text-danger">{fieldErr.form}</p>}
                <Button type="submit" variant="primary" size="lg" loading={busy} className="w-fit">أنشئ حسابي وافتح الدرس ←</Button>
              </form>

              <aside className="flex flex-col gap-3">
                <span className="t-caption text-fg-subtle">ما ينتظرك</span>
                <div className="flex flex-col gap-2 p-5 rounded-card bg-raised border border-line-accent">
                  <span className="t-caption text-fg-subtle">{subjectName || 'مادتك'} · أول درس لم يبدأه أحد</span>
                  <strong className="t-title text-fg-strong">تبدأ بالكتابة مباشرة</strong>
                  <span className="t-label font-normal leading-relaxed text-fg-muted">ننقلك إلى أول درس فارغ في مادتك. اللوحة تبقى في القائمة متى أردتها.</span>
                </div>
                <div className="flex flex-col gap-2 p-4 rounded-card border border-line">
                  <strong className="t-label text-fg-strong">ثلاث خطوات داخل الدرس</strong>
                  {['اكتب عنواناً حقيقياً وملخصاً — البيانات.', 'أضف قسمك الأول، واكتب «/» لتختار نوع العنصر — المحتوى.', 'الجاهزية تقول ما ينقص قبل الإرسال للمراجعة.'].map((t, i) => (
                    <span key={i} className="flex gap-2 t-label font-normal leading-relaxed text-fg-muted"><span className="text-fg-accent">{i + 1}</span>{t}</span>
                  ))}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
