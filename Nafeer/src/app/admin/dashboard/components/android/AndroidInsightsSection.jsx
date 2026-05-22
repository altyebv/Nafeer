'use client';
import { useState, useEffect, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   TABS
───────────────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'overview',  label: 'نظرة عامة',    icon: '◈' },
  { id: 'surveys',   label: 'الاستطلاعات',   icon: '◎' },
  { id: 'feedback',  label: 'الملاحظات',     icon: '◈' },
  { id: 'flags',     label: 'مفاتيح التشغيل', icon: '⚙' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   ROOT SECTION
───────────────────────────────────────────────────────────────────────────── */
export default function AndroidInsightsSection() {
  const [tab, setTab] = useState('overview');

  return (
    <div dir="rtl" className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-arabic font-semibold text-sand-200">
              تحليلات الأندرويد
            </h1>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-teal-700/50 text-teal-500 bg-teal-950/30 tracking-widest">
              BETA
            </span>
          </div>
          <p className="text-sm text-ink-500 font-arabic mt-1">
            مركز رؤية التطبيق — الاستطلاعات والملاحظات والإعدادات الحيّة
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-1 rounded border border-ink-700/40 text-ink-600">
          ANDROID · INSIGHTS
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 bg-ink-800/40 border border-ink-700/40 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-arabic transition-all ${
              tab === t.id
                ? 'bg-sand-900/50 text-sand-300 border border-sand-800/50'
                : 'text-ink-500 hover:text-ink-200 border border-transparent'
            }`}
          >
            <span className={`text-base ${tab === t.id ? 'text-sand-400' : 'text-ink-600'}`}>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {tab === 'overview' && <OverviewTab />}
      {tab === 'surveys'  && <SurveysTab />}
      {tab === 'feedback' && <FeedbackTab />}
      {tab === 'flags'    && <FlagsTab />}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   OVERVIEW TAB
   Pulls aggregated stats and renders four stat cards + flag status + survey list
═════════════════════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/admin/android/overview');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <OverviewSkeleton />;
  if (error)   return <ErrorBanner msg={error} onRetry={load} />;
  if (!data)   return null;

  const { surveys, announcements, responses, feedback, flags } = data;

  const flagsOn = Object.values(flags).filter(Boolean).length;
  const flagsTotal = Object.keys(flags).length;

  return (
    <div className="space-y-6">

      {/* Stat cards row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon="◎"
          label="استطلاعات نشطة"
          value={surveys.active}
          sub={`${surveys.total} إجمالاً`}
          accent="sand"
        />
        <StatCard
          icon="◈"
          label="ردود الاستطلاعات"
          value={responses.total}
          sub={responses.avgDurationSecs > 0
            ? `متوسط ${responses.avgDurationSecs}ث`
            : 'لا توجد بيانات بعد'}
          accent="teal"
        />
        <StatCard
          icon="◈"
          label="ملاحظات المستخدمين"
          value={feedback.total}
          sub={`${feedback.bugs} أخطاء · ${feedback.suggestions} مقترحات`}
          accent="amber"
        />
        <StatCard
          icon="⌘"
          label="الإعلانات النشطة"
          value={announcements.active}
          sub={`${announcements.withBanner} بانر`}
          accent="blue"
        />
      </div>

      {/* Two-column lower section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Feature flags status */}
        <Module title="مفاتيح التشغيل" badge={`${flagsOn}/${flagsTotal} مفعّل`}>
          <div className="space-y-2">
            {Object.entries(flags).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-ink-800/40 border border-ink-700/30">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-teal-400' : 'bg-ink-600'}`} />
                  <span className="text-xs font-mono text-ink-400">{key}</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  val
                    ? 'bg-teal-900/30 border-teal-700/40 text-teal-400'
                    : 'bg-ink-700/30 border-ink-700/30 text-ink-600'
                }`}>
                  {val ? 'ON' : 'OFF'}
                </span>
              </div>
            ))}
          </div>
        </Module>

        {/* Top feedback tags */}
        <Module title="أبرز التصنيفات" badge={`${feedback.total} ملاحظة`}>
          {feedback.topTags.length === 0 ? (
            <EmptyMini label="لا توجد ملاحظات بعد" />
          ) : (
            <div className="space-y-2">
              {feedback.topTags.map(({ tag, count }) => {
                const max   = feedback.topTags[0]?.count ?? 1;
                const width = Math.max(8, Math.round((count / max) * 100));
                return (
                  <div key={tag} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-ink-400">{tag}</span>
                      <span className="text-[10px] font-mono text-ink-600">{count}</span>
                    </div>
                    <div className="h-1 w-full bg-ink-800/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sand-600/50 rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Module>
      </div>

      {/* Per-survey response counts */}
      {Object.keys(responses.perSurvey).length > 0 && (
        <Module title="ردود لكل استطلاع" badge={`${responses.total} إجمالاً`}>
          <div className="space-y-2">
            {Object.entries(responses.perSurvey)
              .sort(([, a], [, b]) => b - a)
              .map(([sid, count]) => (
                <div key={sid} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-ink-800/40 border border-ink-700/30">
                  <span className="text-xs font-mono text-ink-600 truncate flex-1">{sid}</span>
                  <span className="text-xs font-mono text-sand-400 shrink-0">{count} رد</span>
                </div>
              ))}
          </div>
        </Module>
      )}

      <p className="text-[10px] font-mono text-ink-800 text-center">
        آخر تحديث {data.generatedAt ? new Date(data.generatedAt).toLocaleTimeString('ar-SA') : '—'}
      </p>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1,2,3,4].map(n => (
          <div key={n} className="h-24 rounded-xl bg-ink-800/30 border border-ink-700/30 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-40 rounded-xl bg-ink-800/30 border border-ink-700/30 animate-pulse" />
        <div className="h-40 rounded-xl bg-ink-800/30 border border-ink-700/30 animate-pulse" />
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   SURVEYS TAB
   Shows all surveys from CMS, expandable to see per-survey response breakdown
═════════════════════════════════════════════════════════════════════════════ */
function SurveysTab() {
  const [surveys, setSurveys]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [expanded, setExpanded] = useState(null); // surveyId being drilled into

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/admin/comms/surveys');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSurveys(data.items ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingGrid rows={3} />;
  if (error)   return <ErrorBanner msg={error} onRetry={load} />;

  if (surveys.length === 0) {
    return (
      <EmptyState
        icon="◎"
        title="لا توجد استطلاعات"
        sub="أنشئ استطلاعاً من قسم مركز التحكم أولاً"
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-600 font-mono">{surveys.length} استطلاع</p>

      {surveys.map((survey) => (
        <SurveyInsightCard
          key={survey.id}
          survey={survey}
          isExpanded={expanded === survey.id}
          onToggle={() => setExpanded(expanded === survey.id ? null : survey.id)}
        />
      ))}
    </div>
  );
}

function SurveyInsightCard({ survey, isExpanded, onToggle }) {
  const [respData, setRespData] = useState(null);
  const [respLoading, setRespLoading] = useState(false);
  const [respError,   setRespError]   = useState(null);

  const expired = survey.expiresAt && new Date(survey.expiresAt) < new Date();

  // Load responses when expanded
  useEffect(() => {
    if (!isExpanded || respData) return;
    setRespLoading(true);
    setRespError(null);
    fetch(`/api/admin/android/survey-responses?surveyId=${survey.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setRespData(d);
      })
      .catch((e) => setRespError(e.message))
      .finally(() => setRespLoading(false));
  }, [isExpanded, survey.id, respData]);

  const typeCounts = (survey.questions ?? []).reduce((acc, q) => {
    acc[q.type] = (acc[q.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`bg-ink-800/30 border rounded-xl transition-all ${
      expired ? 'border-ink-800/30 opacity-60' : 'border-ink-700/40'
    }`}>
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-right"
      >
        <div className="shrink-0 w-9 h-9 rounded-lg bg-ink-700/40 border border-ink-600/40 flex items-center justify-center text-ink-400 text-sm">
          ◎
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-sm font-arabic font-medium text-ink-100 flex-1">{survey.title}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              {survey.autoPresent && <Pill color="teal">Auto</Pill>}
              {survey.allowSkip   && <Pill color="gray">Skip</Pill>}
              {expired            && <Pill color="red">منتهي</Pill>}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-ink-600">
              {survey.questions?.length ?? 0} سؤال
            </span>
            {Object.entries(typeCounts).map(([type, count]) => (
              <span key={type} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink-700/40 text-ink-500 border border-ink-700/30">
                {TYPE_SHORT[type] ?? type} ×{count}
              </span>
            ))}
            <span className="text-[10px] font-mono text-ink-700">{formatDate(survey.publishedAt)}</span>
          </div>
        </div>

        <span className={`text-ink-600 text-xs font-mono shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {/* Expanded panel — responses breakdown */}
      {isExpanded && (
        <div className="border-t border-ink-700/40 px-5 py-4 space-y-4">

          {respLoading && (
            <div className="flex items-center gap-2 text-xs font-mono text-ink-600">
              <div className="w-3 h-3 rounded-full border border-ink-500/50 border-t-transparent animate-spin" />
              جاري تحميل الردود…
            </div>
          )}

          {respError && <ErrorBanner msg={respError} onRetry={() => setRespData(null)} />}

          {respData && !respLoading && (
            <>
              {/* Summary row */}
              <div className="flex items-center gap-4 flex-wrap">
                <CountChip label="إجمالي الردود" value={respData.total} color="teal" />
                {respData.total === 0 && (
                  <span className="text-xs font-arabic text-ink-600">
                    لم يصل أي رد بعد
                  </span>
                )}
              </div>

              {/* Per-question distribution */}
              {respData.total > 0 && Object.keys(respData.distribution).length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-mono text-ink-600 uppercase tracking-widest">
                    توزيع الإجابات
                  </p>
                  {(survey.questions ?? []).map((q) => {
                    const dist = respData.distribution[q.id] ?? {};
                    const total = Object.values(dist).reduce((a, b) => a + b, 0);
                    return (
                      <QuestionDistribution
                        key={q.id}
                        question={q}
                        distribution={dist}
                        total={total}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionDistribution({ question, distribution, total }) {
  const entries = Object.entries(distribution).sort(([, a], [, b]) => b - a);

  return (
    <div className="rounded-lg bg-ink-800/40 border border-ink-700/30 px-4 py-3 space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink-700/40 text-ink-500 border border-ink-700/30 shrink-0">
          {TYPE_SHORT[question.type] ?? question.type}
        </span>
        <p className="text-xs font-arabic text-ink-300 leading-snug flex-1">{question.text}</p>
      </div>

      {entries.length === 0 ? (
        <p className="text-[11px] font-mono text-ink-700">لا إجابات</p>
      ) : (
        <div className="space-y-1.5 pt-1">
          {entries.slice(0, 8).map(([answer, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={answer} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-arabic text-ink-400 truncate max-w-[70%]">
                    {answer || '—'}
                  </span>
                  <span className="text-[10px] font-mono text-ink-600">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="h-1 w-full bg-ink-800/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600/50 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {entries.length > 8 && (
            <p className="text-[10px] font-mono text-ink-700">
              +{entries.length - 8} إجابة أخرى
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   FEEDBACK TAB
   Bug reports and suggestions with tag breakdown and screen clustering
═════════════════════════════════════════════════════════════════════════════ */
function FeedbackTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('ALL'); // ALL | BUG_REPORT | SUGGESTION

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/admin/android/feedback');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingGrid rows={4} />;
  if (error)   return <ErrorBanner msg={error} onRetry={load} />;

  if (!data || data.total === 0) {
    return (
      <EmptyState
        icon="◈"
        title="لا توجد ملاحظات بعد"
        sub="ستظهر الملاحظات هنا بمجرد أن يرسلها المستخدمون من التطبيق"
      />
    );
  }

  const { items, tagCounts, topScreens, versionCounts } = data;
  const bugs        = items.filter((i) => i.type === 'BUG_REPORT');
  const suggestions = items.filter((i) => i.type === 'SUGGESTION');
  const displayed   = filter === 'BUG_REPORT'
    ? bugs
    : filter === 'SUGGESTION'
    ? suggestions
    : items;

  return (
    <div className="space-y-5">

      {/* Type breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <CountChipLarge
          label="الكل"
          value={items.length}
          active={filter === 'ALL'}
          onClick={() => setFilter('ALL')}
          color="gray"
        />
        <CountChipLarge
          label="أخطاء"
          value={bugs.length}
          active={filter === 'BUG_REPORT'}
          onClick={() => setFilter('BUG_REPORT')}
          color="red"
        />
        <CountChipLarge
          label="مقترحات"
          value={suggestions.length}
          active={filter === 'SUGGESTION'}
          onClick={() => setFilter('SUGGESTION')}
          color="teal"
        />
      </div>

      {/* Side panels */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Tag frequency */}
        <Module title="التصنيفات" badge={`${Object.keys(tagCounts).length} نوع`}>
          {Object.keys(tagCounts).length === 0 ? (
            <EmptyMini label="لا تصنيفات" />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(tagCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([tag, count]) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-full bg-ink-700/40 border border-ink-700/30 text-ink-400"
                  >
                    {tag}
                    <span className="text-[9px] text-ink-600">{count}</span>
                  </span>
                ))}
            </div>
          )}
        </Module>

        {/* Top screens */}
        <Module title="الشاشات الأكثر إبلاغاً" badge={`${topScreens.length} شاشة`}>
          {topScreens.length === 0 ? (
            <EmptyMini label="لا بيانات شاشات" />
          ) : (
            <div className="space-y-2">
              {topScreens.slice(0, 6).map(({ screen, count }) => {
                const max = topScreens[0]?.count ?? 1;
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={screen} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-ink-400 truncate max-w-[75%]">
                        {screen}
                      </span>
                      <span className="text-[10px] font-mono text-ink-600">{count}</span>
                    </div>
                    <div className="h-1 w-full bg-ink-800/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600/40 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Module>
      </div>

      {/* App version breakdown */}
      {Object.keys(versionCounts).length > 0 && (
        <Module title="إصدارات التطبيق" badge={`${Object.keys(versionCounts).length} إصدار`}>
          <div className="flex flex-wrap gap-2">
            {Object.entries(versionCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([ver, count]) => (
                <span key={ver} className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-ink-800/40 border border-ink-700/30 text-ink-400">
                  <span className="text-ink-600">v</span>{ver}
                  <span className="text-[9px] text-ink-600 ml-1">{count}×</span>
                </span>
              ))}
          </div>
        </Module>
      )}

      {/* Feedback list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-600 font-mono">
            {displayed.length} عنصر{filter !== 'ALL' ? ` (${filter === 'BUG_REPORT' ? 'أخطاء' : 'مقترحات'})` : ''}
          </p>
        </div>

        {displayed.length === 0 ? (
          <EmptyMini label="لا توجد عناصر بهذا التصنيف" />
        ) : (
          displayed.slice(0, 30).map((item) => (
            <FeedbackCard key={item.id} item={item} />
          ))
        )}
        {displayed.length > 30 && (
          <p className="text-[11px] font-mono text-ink-700 text-center">
            يُعرض أحدث 30 عنصراً من {displayed.length}
          </p>
        )}
      </div>
    </div>
  );
}

function FeedbackCard({ item }) {
  const isBug = item.type === 'BUG_REPORT';
  const tags  = Array.isArray(item.tags) ? item.tags : [];

  return (
    <div className="group bg-ink-800/30 border border-ink-700/40 rounded-xl px-5 py-4 space-y-2 hover:border-ink-600/50 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs ${
            isBug
              ? 'bg-red-900/30 border-red-700/40 text-red-400'
              : 'bg-teal-900/30 border-teal-700/40 text-teal-400'
          }`}>
            {isBug ? '✕' : '◈'}
          </div>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
            isBug
              ? 'bg-red-900/20 border-red-800/40 text-red-500'
              : 'bg-teal-900/20 border-teal-800/40 text-teal-500'
          }`}>
            {isBug ? 'BUG' : 'SUGGESTION'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-ink-700 shrink-0">
          {item.screenName && (
            <span className="px-1.5 py-0.5 rounded bg-ink-700/30 border border-ink-700/30">
              {item.screenName}
            </span>
          )}
          {item.appVersion && (
            <span>v{item.appVersion}</span>
          )}
        </div>
      </div>

      {item.body && (
        <p className="text-sm font-arabic text-ink-300 leading-relaxed line-clamp-3">
          {item.body || <span className="text-ink-700 italic">بدون نص</span>}
        </p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-ink-700/30 border border-ink-700/30 text-ink-500">
              {t}
            </span>
          ))}
        </div>
      )}

      {item.createdAt && (
        <p className="text-[10px] font-mono text-ink-700">
          {new Date(item.createdAt).toLocaleString('ar-SA', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
          {item.deviceModel ? ` · ${item.deviceModel}` : ''}
        </p>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   FLAGS TAB
   Read + toggle comms feature flags (same logic as CommsSection's AppSettingsTab
   but scoped to this screen)
═════════════════════════════════════════════════════════════════════════════ */
const FLAG_DEFS = [
  {
    key:      'commCenterEnabled',
    label:    'مركز التواصل',
    desc:     'البوابة الرئيسية — يتحكم في ظهور الإعلانات والاستطلاعات والجولات في التطبيق.',
    icon:     '⌘',
    isMaster: true,
  },
  {
    key:       'feedbackEnabled',
    label:     'نموذج الملاحظات',
    desc:      'يُظهر رابط الملاحظات في الملف الشخصي وإعدادات التطبيق.',
    icon:      '◈',
    dependsOn: null,
  },
  {
    key:       'toursEnabled',
    label:     'الجولات التعريفية',
    desc:      'تشغيل الجولات تلقائياً عند أول دخول للمستخدم.',
    icon:      '◉',
    dependsOn: 'commCenterEnabled',
  },
];

function FlagsTab() {
  const [flags, setFlags]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [saving, setSaving]     = useState(null);
  const [saveError, setSaveError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/admin/comms/feature-flags');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFlags(data.flags);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (key) => {
    if (saving) return;
    const next = !flags[key];
    setFlags((p) => ({ ...p, [key]: next }));
    setSaving(key);
    setSaveError(null);
    try {
      const res  = await fetch('/api/admin/comms/feature-flags', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ [key]: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFlags(data.flags);
    } catch (e) {
      setFlags((p) => ({ ...p, [key]: !next }));
      setSaveError(e.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <LoadingGrid rows={3} />;
  if (error)   return <ErrorBanner msg={error} onRetry={load} />;

  const masterOn = flags?.commCenterEnabled;

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-arabic font-medium text-ink-200">Feature Flags</p>
          <p className="text-xs text-ink-600 font-arabic mt-0.5">
            التغييرات تنعكس في التطبيق عند أول sync بعد الحفظ
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-1 rounded border border-ink-700/40 text-ink-700">
          content_config/manifest
        </span>
      </div>

      {!masterOn && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-950/30 border border-amber-800/30">
          <span className="text-amber-500 text-base leading-none mt-0.5">⚠</span>
          <p className="text-xs text-amber-400/80 font-arabic leading-relaxed">
            مركز التواصل مغلق — لن يصل أي شيء للمستخدمين حتى يتم تفعيله.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-ink-700/40 bg-ink-800/20 divide-y divide-ink-700/30 overflow-hidden">
        {FLAG_DEFS.map((def) => {
          const isOn         = flags?.[def.key] ?? false;
          const isSaving     = saving === def.key;
          const isDepBlocked = def.dependsOn && !flags?.[def.dependsOn];

          return (
            <div
              key={def.key}
              className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                isDepBlocked ? 'opacity-50' : 'hover:bg-ink-700/10'
              }`}
            >
              <div className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center text-sm transition-colors ${
                isOn
                  ? 'bg-teal-900/30 border-teal-700/40 text-teal-400'
                  : 'bg-ink-700/30 border-ink-600/30 text-ink-500'
              }`}>
                {def.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-arabic font-medium text-ink-100 leading-snug">
                    {def.label}
                  </p>
                  {def.isMaster && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-sand-800/50 text-sand-600 bg-sand-900/20">
                      MASTER
                    </span>
                  )}
                  {isDepBlocked && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-ink-700/40 text-ink-600">
                      يتطلب مركز التواصل
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-500 font-arabic mt-0.5 leading-relaxed">{def.desc}</p>
              </div>

              <button
                onClick={() => handleToggle(def.key)}
                disabled={isSaving}
                role="switch"
                aria-checked={isOn}
                className="shrink-0 focus:outline-none disabled:cursor-not-allowed"
              >
                <div className={`relative w-11 h-6 rounded-full border transition-all duration-200 ${
                  isOn
                    ? 'bg-teal-600/40 border-teal-500/50'
                    : 'bg-ink-700/60 border-ink-600/40'
                }`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full border shadow-sm transition-all duration-200 ${
                    isOn
                      ? 'right-0.5 bg-teal-400 border-teal-300/50'
                      : 'left-0.5 bg-ink-500 border-ink-400/40'
                  } ${isSaving ? 'opacity-50' : ''}`} />
                  {isSaving && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full border border-ink-400/50 border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {saveError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/30 border border-red-900/40">
          <span className="text-red-400 text-sm">✕</span>
          <p className="text-xs font-arabic text-red-400">{saveError}</p>
          <button
            onClick={() => setSaveError(null)}
            className="mr-auto text-[10px] font-mono text-red-500 hover:text-red-300 transition-colors"
          >
            إغلاق
          </button>
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   SHARED UI PRIMITIVES
═════════════════════════════════════════════════════════════════════════════ */

function StatCard({ icon, label, value, sub, accent = 'sand' }) {
  const accents = {
    sand:  { bg: 'bg-sand-900/20', border: 'border-sand-800/40', icon: 'text-sand-500', value: 'text-sand-200' },
    teal:  { bg: 'bg-teal-900/20', border: 'border-teal-800/40', icon: 'text-teal-500', value: 'text-teal-200' },
    amber: { bg: 'bg-amber-900/20', border: 'border-amber-800/40', icon: 'text-amber-500', value: 'text-amber-200' },
    blue:  { bg: 'bg-blue-900/20', border: 'border-blue-800/40', icon: 'text-blue-500', value: 'text-blue-200' },
  };
  const a = accents[accent] ?? accents.sand;

  return (
    <div className={`rounded-xl border ${a.bg} ${a.border} px-4 py-4 space-y-2`}>
      <div className="flex items-center justify-between">
        <span className={`text-lg ${a.icon}`}>{icon}</span>
        <span className="text-[9px] font-mono text-ink-700 uppercase tracking-widest">{label}</span>
      </div>
      <div>
        <p className={`text-2xl font-mono font-bold ${a.value}`}>{value}</p>
        <p className="text-[11px] font-arabic text-ink-600 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function Module({ title, badge, children }) {
  return (
    <div className="rounded-xl bg-ink-800/30 border border-ink-700/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-700/30">
        <p className="text-xs font-arabic font-medium text-ink-300">{title}</p>
        {badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-ink-700/40 text-ink-600">
            {badge}
          </span>
        )}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function CountChip({ label, value, color = 'teal' }) {
  const colors = {
    teal:  'bg-teal-900/30 border-teal-700/40 text-teal-300',
    amber: 'bg-amber-900/30 border-amber-700/40 text-amber-300',
    red:   'bg-red-900/30 border-red-700/40 text-red-300',
    gray:  'bg-ink-700/40 border-ink-600/40 text-ink-300',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colors[color] ?? colors.gray}`}>
      <span className="text-lg font-mono font-bold">{value}</span>
      <span className="text-xs font-arabic">{label}</span>
    </div>
  );
}

function CountChipLarge({ label, value, active, onClick, color }) {
  const colors = {
    teal:  { on: 'bg-teal-900/40 border-teal-600/50 text-teal-300', off: 'bg-ink-800/30 border-ink-700/40 text-ink-400' },
    red:   { on: 'bg-red-900/40 border-red-600/50 text-red-300',   off: 'bg-ink-800/30 border-ink-700/40 text-ink-400' },
    gray:  { on: 'bg-ink-700/60 border-ink-500/50 text-ink-200',   off: 'bg-ink-800/30 border-ink-700/40 text-ink-400' },
  };
  const c = colors[color] ?? colors.gray;
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-center transition-all ${active ? c.on : c.off} hover:border-ink-500/60`}
    >
      <p className="text-xl font-mono font-bold">{value}</p>
      <p className="text-xs font-arabic mt-0.5">{label}</p>
    </button>
  );
}

function Pill({ color = 'gray', children }) {
  const colors = {
    teal: 'bg-teal-900/30 border-teal-700/40 text-teal-400',
    gray: 'bg-ink-700/40 border-ink-600/40 text-ink-400',
    red:  'bg-red-900/30 border-red-700/40 text-red-400',
  };
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${colors[color] ?? colors.gray}`}>
      {children}
    </span>
  );
}

function LoadingGrid({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-ink-800/30 border border-ink-700/30 animate-pulse" />
      ))}
    </div>
  );
}

function ErrorBanner({ msg, onRetry }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm font-arabic">
      <span>{msg}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-mono hover:text-red-300 transition-colors mr-2">
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="rounded-2xl border border-ink-700/30 border-dashed bg-ink-800/10 px-8 py-14 text-center space-y-2">
      <div className="w-10 h-10 rounded-xl bg-ink-800/40 border border-ink-700/30 flex items-center justify-center text-lg text-ink-600 mx-auto">
        {icon}
      </div>
      <p className="text-sm font-arabic text-ink-500">{title}</p>
      <p className="text-xs text-ink-700 font-arabic">{sub}</p>
    </div>
  );
}

function EmptyMini({ label }) {
  return <p className="text-xs font-arabic text-ink-700 py-2">{label}</p>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */
const TYPE_SHORT = {
  YES_NO:          'Y/N',
  RATING:          '★',
  NPS:             'NPS',
  FREE_FORM:       'FF',
  MULTIPLE_CHOICE: 'MC',
};

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('ar-SA', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export { AndroidInsightsSection };