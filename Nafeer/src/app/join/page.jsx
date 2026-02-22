'use client';
import { useState } from 'react';

const subjects = [
  'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء',
  'التاريخ', 'الجغرافيا', 'اللغة العربية', 'الاقتصاد',
  'التربية الإسلامية', 'اللغة الإنجليزية', 'أخرى',
];

const STAGES = {
  FORM: 'form',
  SUCCESS: 'success',
};

export default function JoinPage() {
  const [stage, setStage] = useState(STAGES.FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    background: '',
    motivation: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contributors/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'حدث خطأ ما');
        return;
      }

      setStage(STAGES.SUCCESS);
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  if (stage === STAGES.SUCCESS) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="absolute inset-0 mesh-bg pointer-events-none" />
        <div className="relative z-10 text-center max-w-md">
          <div className="text-7xl mb-6 animate-float">🌟</div>
          <h1 className="text-3xl font-arabic font-bold text-sand-400 mb-4">
            شكراً لك!
          </h1>
          <p className="text-ink-300 leading-loose mb-8">
            وصل طلبك بنجاح. سنراجعه ونتواصل معك على بريدك الإلكتروني قريباً.
            نحن نقدّر كل من يريد المساهمة في هذا المشروع.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sand-500 hover:text-sand-400 transition-colors"
          >
            <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>←</span>
            العودة للرئيسية
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 relative">
      <div className="absolute inset-0 mesh-bg pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <a href="/" className="inline-block mb-6">
            <h1 className="text-3xl font-arabic font-bold text-sand-400">نفير</h1>
          </a>
          <h2 className="text-2xl font-arabic font-bold text-sand-100 mb-3">انضم للنفير</h2>
          <p className="text-ink-400 leading-loose text-sm">
            أخبرنا عن نفسك وسنوافيك بالرد خلال أيام
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-ink-700/40 p-8">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-ink-400 mb-2">الاسم *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 focus:ring-1 focus:ring-sand-600/40 transition-all"
                  placeholder="اسمك الكريم"
                />
              </div>
              <div>
                <label className="block text-sm text-ink-400 mb-2">البريد الإلكتروني *</label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 focus:ring-1 focus:ring-sand-600/40 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-ink-400 mb-2">المادة التي تريد المساهمة فيها *</label>
              <select
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-sand-100 focus:outline-none focus:border-sand-600 focus:ring-1 focus:ring-sand-600/40 transition-all"
              >
                <option value="" disabled>اختر المادة</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-ink-400 mb-2">
                خلفيتك في المادة *
                <span className="text-ink-600 mr-1">(معلم، طالب جامعي، متخصص...)</span>
              </label>
              <input
                type="text"
                required
                value={form.background}
                onChange={(e) => setForm({ ...form, background: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 focus:ring-1 focus:ring-sand-600/40 transition-all"
                placeholder="مثال: معلم رياضيات بـ 5 سنوات خبرة"
              />
            </div>

            <div>
              <label className="block text-sm text-ink-400 mb-2">لماذا تريد المساهمة؟</label>
              <textarea
                rows={3}
                value={form.motivation}
                onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-ink-900/60 border border-ink-700/60 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 focus:ring-1 focus:ring-sand-600/40 transition-all resize-none"
                placeholder="بكل حرية..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-sand-500 hover:bg-sand-400 disabled:bg-ink-700 disabled:cursor-not-allowed text-ink-950 disabled:text-ink-500 font-bold rounded-xl transition-all duration-200 hover:shadow-[0_0_30px_rgba(212,137,30,0.25)]"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <a href="/signin" className="text-ink-600 hover:text-sand-500 text-sm transition-colors">
            لديك حساب بالفعل؟ سجّل الدخول
          </a>
        </div>
      </div>
    </div>
  );
}
