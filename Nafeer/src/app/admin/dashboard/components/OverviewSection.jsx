'use client';
import { useState, useEffect } from 'react';

// ── Metric card ────────────────────────────────────────────────────────────────
function MetricCard({ icon, value, label, sub, accent = false }) {
  return (
    <div
      className="relative p-5 rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: accent ? 'rgba(212,137,30,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${accent ? 'rgba(212,137,30,0.2)' : 'rgba(255,255,255,0.07)'}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = accent ? 'rgba(212,137,30,0.09)' : 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = accent ? 'rgba(212,137,30,0.06)' : 'rgba(255,255,255,0.02)'; }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xl">{icon}</span>
      </div>
      <p
        className="text-3xl font-bold font-mono tabular-nums mb-1"
        style={{ color: accent ? 'var(--accent)' : '#e8e0d5' }}
      >
        {value ?? '—'}
      </p>
      <p className="text-xs font-arabic text-ink-500">{label}</p>
      {sub && <p className="text-[10px] font-mono text-ink-700 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Section label ──────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-widest mb-4 text-ink-600">{children}</p>
  );
}

// ── Contributor mini row ───────────────────────────────────────────────────────
function ContributorRow({ c, rank }) {
  const initials = (c.name || '?').split(' ').slice(0, 2).map((w) => w[0]).join('');
  const total = (c.stats?.lessonsCreated || 0) + (c.stats?.questionsAdded || 0) + (c.stats?.feedItemsCreated || 0);
  return (
    <div
      className="flex items-center gap-3 py-2.5 transition-colors duration-150 group cursor-default"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <span className="text-[10px] font-mono w-5 text-center shrink-0 text-ink-700">{rank}</span>
      {c.avatarUrl ? (
        <img src={c.avatarUrl} alt={c.name} className="w-7 h-7 rounded-full object-cover shrink-0" style={{ border: '1px solid rgba(212,137,30,0.3)' }} />
      ) : (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, #d4891e 0%, rgba(146,79,18,0.5) 100%)', color: '#0e0c09' }}>
          {initials}
        </div>
      )}
      <span className="flex-1 text-sm font-arabic truncate text-ink-300 group-hover:text-sand-300 transition-colors duration-150">{c.name}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{total}</span>
        {c.username && (
          <a
            href={`/contributors/${c.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-ink-700 hover:text-sand-400 transition-colors px-1.5 py-0.5 rounded border border-transparent hover:border-ink-700/50"
            title="عرض الملف الشخصي"
          >
            ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ── Visit sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data }) {
  if (!data || data.length < 2) return null;

  // Fill last 30 days with zeros for gaps
  const days = 30;
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = data.find((b) => b.date === key);
    buckets.push({ date: key, count: found?.count || 0 });
  }

  const max = Math.max(...buckets.map((b) => b.count), 1);
  const W = 300, H = 60, pad = 4;

  const pts = buckets.map((b, i) => {
    const x = pad + (i / (buckets.length - 1)) * (W - pad * 2);
    const y = H - pad - (b.count / max) * (H - pad * 2);
    return [x, y];
  });

  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const fillPath = `${linePath} L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`;

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = data.find((b) => b.date === today)?.count || 0;
  const yesterday  = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);
  const yesterdayCount = data.find((b) => b.date === yKey)?.count || 0;
  const trend = yesterdayCount > 0 ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: 'var(--accent)' }}>
            {todayCount}
          </p>
          <p className="text-xs text-ink-600 font-arabic">زيارة اليوم</p>
        </div>
        {trend !== null && (
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
            trend >= 0 ? 'text-green-400 bg-green-950/40 border-green-800/40' : 'text-red-400 bg-red-950/40 border-red-800/40'
          }`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 56, overflow: 'visible' }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4891e" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#d4891e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#sparkFill)" />
        <path d={linePath} fill="none" stroke="#d4891e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Today dot */}
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill="#d4891e" />
      </svg>
      <p className="text-[10px] font-mono text-ink-700 mt-1 text-left" dir="ltr">آخر 30 يوم</p>
    </div>
  );
}

// ── Curriculum bar ─────────────────────────────────────────────────────────────
function CurriculumBar({ track, label, seeded, total }) {
  const pct = total > 0 ? Math.round((seeded / total) * 100) : 0;
  const colors = { COMMON: '#38bdf8', SCIENCE: '#4ade80', LITERARY: '#c084fc' };
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-arabic w-14 shrink-0 text-ink-500">{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: colors[track] || '#d4891e' }} />
      </div>
      <span className="text-[10px] font-mono w-14 text-left shrink-0 text-ink-700" dir="ltr">
        {seeded}/{total}
      </span>
    </div>
  );
}

// ── Pipeline pill ──────────────────────────────────────────────────────────────
function PipelinePill({ label, count, color }) {
  if (!count) return null;
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors duration-150 hover:bg-ink-800/30"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="text-xs font-arabic text-ink-400">{label}</span>
      <span className={`text-sm font-mono font-bold tabular-nums ${color}`}>{count}</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export function OverviewSection({ allContributors }) {
  const [siteData,   setSiteData]   = useState(null);
  const [seedData,   setSeedData]   = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/site-setting').then((r) => r.json()).catch(() => null),
      fetch('/api/admin/seed').then((r) => r.json()).catch(() => null),
      fetch('/api/admin/review-queue?limit=0').then((r) => r.json()).catch(() => null),
    ]).then(([site, seed, review]) => {
      setSiteData(site?.data || null);
      setSeedData(seed?.subjects || null);
      setReviewData(review || null);
      setLoading(false);
    });
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const contributors = allContributors || [];
  const approved  = contributors.filter((c) => c.status === 'approved');
  const pending   = contributors.filter((c) => c.status === 'pending');

  const topContributors = [...approved]
    .sort((a, b) => {
      const scoreA = (a.stats?.lessonsCreated || 0) * 3 + (a.stats?.questionsAdded || 0) + (a.stats?.feedItemsCreated || 0) * 2;
      const scoreB = (b.stats?.lessonsCreated || 0) * 3 + (b.stats?.questionsAdded || 0) + (b.stats?.feedItemsCreated || 0) * 2;
      return scoreB - scoreA;
    })
    .slice(0, 5);

  const subjects    = seedData || [];
  const byTrack     = ['COMMON', 'SCIENCE', 'LITERARY'].map((track) => {
    const g = subjects.filter((s) => s.track === track);
    return { track, label: { COMMON: 'مشترك', SCIENCE: 'علمي', LITERARY: 'أدبي' }[track], seeded: g.filter((s) => s.seeded).length, total: g.length };
  });
  const totalSeeded   = subjects.filter((s) => s.seeded).length;
  const totalSubjects = subjects.length;
  const curriculumPct = totalSubjects > 0 ? Math.round((totalSeeded / totalSubjects) * 100) : 0;

  const visits      = siteData?.visitCount  || 0;
  const support     = siteData?.supportCount || 0;
  const visitsByDay = siteData?.visitsByDay  || [];

  const totalLessons   = contributors.reduce((a, c) => a + (c.stats?.lessonsCreated   || 0), 0);
  const totalQuestions = contributors.reduce((a, c) => a + (c.stats?.questionsAdded   || 0), 0);
  const totalFeed      = contributors.reduce((a, c) => a + (c.stats?.feedItemsCreated || 0), 0);

  const reviewTotal = reviewData?.total || 0;

  const now     = new Date();
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-ink-500">
          <span className="inline-block w-5 h-5 border-2 border-ink-700 border-t-sand-400 rounded-full animate-spin" />
          <span className="font-arabic text-sm">جارٍ تحميل البيانات…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-8 py-8 space-y-8 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-arabic font-bold mb-1 text-ink-100">نظرة عامة</h1>
          <p className="text-sm font-arabic text-ink-600">{dateStr}</p>
        </div>
        <div dir="ltr" className="text-left shrink-0">
          <p className="text-2xl font-mono font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{timeStr}</p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-ink-700">NAFEER ADMIN</p>
        </div>
      </div>

      {/* ── Site metrics ── */}
      <div>
        <Label>إحصائيات الموقع</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard icon="👁"  value={visits.toLocaleString('ar-EG')}  label="زيارة إجمالية" accent />
          <MetricCard icon="🙋" value={support.toLocaleString('ar-EG')} label="طالب داعم" />
          <MetricCard icon="◉"  value={approved.length}                 label="مساهم نشط" />
          <MetricCard icon="⏳" value={pending.length}                  label="طلب معلّق" />
        </div>
      </div>

      {/* ── Visit sparkline ── */}
      {visitsByDay.length > 1 && (
        <div>
          <Label>حركة الزيارات — آخر 30 يوم</Label>
          <div
            className="p-5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Sparkline data={visitsByDay} />
          </div>
        </div>
      )}

      {/* ── Content stats ── */}
      <div>
        <Label>المحتوى المُنجز</Label>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard icon="📖" value={totalLessons}   label="درس مكتوب"     />
          <MetricCard icon="❓" value={totalQuestions} label="سؤال في البنك"  />
          <MetricCard icon="📡" value={totalFeed}      label="عنصر تغذية"    />
        </div>
      </div>

      {/* ── Two-column ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Top contributors */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Label>أكثر المساهمين نشاطاً</Label>
          {topContributors.length === 0 ? (
            <p className="text-sm text-ink-600 font-arabic py-4">لا يوجد مساهمون بعد</p>
          ) : (
            topContributors.map((c, i) => <ContributorRow key={c._id} c={c} rank={i + 1} />)
          )}
        </div>

        {/* Curriculum health */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Label>صحة المنهج الدراسي</Label>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p
                className="text-3xl font-bold font-mono tabular-nums"
                style={{ color: curriculumPct >= 80 ? '#4ade80' : curriculumPct >= 40 ? '#d4891e' : '#f87171' }}
              >
                {curriculumPct}%
              </p>
              <p className="text-xs text-ink-600 font-arabic mt-0.5">{totalSeeded} من {totalSubjects} مادة مبذورة</p>
            </div>
            <div dir="rtl">
              {subjects.filter((s) => s.catalogError).length > 0 && (
                <p className="text-[11px] font-arabic text-red-400">✕ {subjects.filter((s) => s.catalogError).length} خطأ</p>
              )}
              {subjects.filter((s) => s.seeded && (s.missingUnits > 0 || s.missingLessons > 0)).length > 0 && (
                <p className="text-[11px] font-arabic text-amber-400">◎ {subjects.filter((s) => s.seeded && (s.missingUnits > 0 || s.missingLessons > 0)).length} ناقص</p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {byTrack.map((t) => <CurriculumBar key={t.track} {...t} />)}
          </div>
        </div>
      </div>

      {/* ── Review + Pipeline ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Review queue */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Label>طابور المراجعة</Label>
          {reviewTotal === 0 ? (
            <div className="flex items-center gap-2 py-2">
              <span className="text-green-400 text-lg">✓</span>
              <p className="text-sm font-arabic text-ink-500">لا يوجد محتوى ينتظر المراجعة</p>
            </div>
          ) : (
            <>
              <p className="text-4xl font-bold font-mono tabular-nums mb-1" style={{ color: reviewTotal > 10 ? '#fb923c' : '#d4891e' }}>
                {reviewTotal}
              </p>
              <p className="text-xs font-arabic text-ink-600">عنصر ينتظر المراجعة — افتح طابور المراجعة للتفاصيل</p>
            </>
          )}
        </div>

        {/* Contributor pipeline */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Label>خط المساهمين</Label>
          <div className="space-y-2">
            <PipelinePill
              label="طلبات جديدة"
              count={contributors.filter((c) => c.status === 'pending' && !c.interviewToken && !c.interviewAnswers?.submittedAt && !c.dynamicAnswersSubmittedAt).length}
              color="text-amber-400"
            />
            <PipelinePill
              label="ينتظر المقابلة"
              count={contributors.filter((c) => c.status === 'pending' && c.interviewToken && !c.interviewAnswers?.submittedAt && !c.dynamicAnswersSubmittedAt).length}
              color="text-blue-400"
            />
            <PipelinePill
              label="أكمل المقابلة"
              count={contributors.filter((c) => c.status === 'pending' && (c.interviewAnswers?.submittedAt || c.dynamicAnswersSubmittedAt)).length}
              color="text-green-400"
            />
            <PipelinePill
              label="ينتظر التأهيل"
              count={contributors.filter((c) => c.status === 'approved' && !c.onboarded).length}
              color="text-purple-400"
            />
            {pending.length === 0 && (
              <div className="flex items-center gap-2 py-1">
                <span className="text-green-400">✓</span>
                <p className="text-xs font-arabic text-ink-600">لا يوجد طلبات معلّقة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}