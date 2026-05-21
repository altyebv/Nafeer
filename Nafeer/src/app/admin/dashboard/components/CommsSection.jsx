'use client';
import { useState, useEffect, useCallback } from 'react';
import { CreateAnnouncementModal } from './modals/CreateAnnouncementModal';
import { CreateSurveyModal } from './modals/CreateSurveyModal';

/* ── Tab config ─────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'announcements', label: 'الإعلانات',          icon: '⌘' },
  { id: 'surveys',       label: 'الاستطلاعات',         icon: '◎' },
  { id: 'app-settings',  label: 'إعدادات التطبيق',     icon: '⚙' },
];

/* ── Root section ───────────────────────────────────────────────────────────── */
export default function CommsSection() {
  const [tab, setTab] = useState('announcements');

  return (
    <div dir="rtl" className="space-y-6">

      {/* Section header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-arabic font-semibold text-sand-200">
            التواصل والاستطلاعات
          </h1>
          <p className="text-sm text-ink-500 font-arabic mt-1">
            إدارة الإعلانات والاستطلاعات المرسلة للمستخدمين
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-1 rounded border border-ink-700/40 text-ink-600">
          COMMS
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

      {/* Tab panels */}
      {tab === 'announcements' && <AnnouncementsTab />}
      {tab === 'surveys'       && <SurveysTab />}
      {tab === 'app-settings'  && <AppSettingsTab />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ANNOUNCEMENTS TAB
═══════════════════════════════════════════════════════════════════════════════ */
function AnnouncementsTab() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [modal, setModal]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/admin/comms/announcements');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(data.items ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('حذف هذا الإعلان نهائياً؟')) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/comms/announcements/${id}`, { method: 'DELETE' });
      setItems((p) => p.filter((i) => i.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleBanner = async (item) => {
    await fetch(`/api/admin/comms/announcements/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showBanner: !item.showBanner }),
    });
    setItems((p) =>
      p.map((i) => (i.id === item.id ? { ...i, showBanner: !i.showBanner } : i)),
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-600 font-mono">
          {loading ? '...' : `${items.length} إعلان`}
        </p>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-arabic bg-sand-700/20 hover:bg-sand-700/40 border border-sand-800/50 text-sand-400 hover:text-sand-300 transition-all"
        >
          <span className="text-base leading-none">+</span>
          إعلان جديد
        </button>
      </div>

      {/* States */}
      {loading && <LoadingGrid />}
      {error   && <ErrorBanner msg={error} onRetry={load} />}

      {/* List */}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon="⌘"
          title="لا توجد إعلانات"
          sub="أنشئ إعلانك الأول ليصل إلى المستخدمين"
        />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <AnnouncementCard
              key={item.id}
              item={item}
              deleting={deleting === item.id}
              onDelete={() => handleDelete(item.id)}
              onToggleBanner={() => handleToggleBanner(item)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <CreateAnnouncementModal
          onClose={() => setModal(false)}
          onCreated={(item) => setItems((p) => [item, ...p])}
        />
      )}
    </div>
  );
}

function AnnouncementCard({ item, deleting, onDelete, onToggleBanner }) {
  const expired = item.expiresAt && new Date(item.expiresAt) < new Date();

  return (
    <div className={`group bg-ink-800/30 border rounded-xl px-5 py-4 flex gap-4 transition-all ${
      expired ? 'border-ink-800/30 opacity-60' : 'border-ink-700/40 hover:border-ink-600/50'
    }`}>
      {/* Icon */}
      <div className="shrink-0 w-9 h-9 rounded-lg bg-sand-900/40 border border-sand-800/40 flex items-center justify-center text-sand-500 text-sm">
        {item.imageUrl ? '🖼' : '⌘'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="text-sm font-arabic font-medium text-ink-100 leading-snug flex-1">
            {item.title}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {item.showBanner && (
              <Badge color="amber">Banner</Badge>
            )}
            {item.ctaLabel && (
              <Badge color="blue">CTA</Badge>
            )}
            {expired && (
              <Badge color="red">منتهي</Badge>
            )}
          </div>
        </div>

        <p className="text-xs text-ink-500 font-arabic mt-1 line-clamp-2">{item.body}</p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          <span className="text-[10px] font-mono text-ink-700">
            {formatDate(item.publishedAt)}
          </span>
          {item.expiresAt && (
            <span className="text-[10px] font-mono text-ink-700">
              ينتهي {formatDate(item.expiresAt)}
            </span>
          )}
          {item.segmentUserIds?.length > 0 && (
            <span className="text-[10px] font-mono text-ink-700">
              {item.segmentUserIds.length} مستخدم
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Banner toggle */}
        <ActionBtn
          onClick={onToggleBanner}
          title={item.showBanner ? 'إخفاء البانر' : 'إظهار البانر'}
          className={item.showBanner ? 'text-amber-400 hover:text-amber-300' : 'text-ink-600 hover:text-ink-300'}
        >
          ◧
        </ActionBtn>

        {/* Delete */}
        <ActionBtn
          onClick={onDelete}
          disabled={deleting}
          className="text-ink-600 hover:text-red-400"
          title="حذف"
        >
          {deleting ? '…' : '✕'}
        </ActionBtn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SURVEYS TAB
═══════════════════════════════════════════════════════════════════════════════ */
function SurveysTab() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [modal, setModal]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/admin/comms/surveys');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(data.items ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('حذف هذا الاستطلاع نهائياً؟')) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/comms/surveys/${id}`, { method: 'DELETE' });
      setItems((p) => p.filter((i) => i.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-600 font-mono">
          {loading ? '...' : `${items.length} استطلاع`}
        </p>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-arabic bg-sand-700/20 hover:bg-sand-700/40 border border-sand-800/50 text-sand-400 hover:text-sand-300 transition-all"
        >
          <span className="text-base leading-none">+</span>
          استطلاع جديد
        </button>
      </div>

      {loading && <LoadingGrid />}
      {error   && <ErrorBanner msg={error} onRetry={load} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon="◎"
          title="لا توجد استطلاعات"
          sub="أنشئ استطلاعك الأول لجمع آراء المستخدمين"
        />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <SurveyCard
              key={item.id}
              item={item}
              deleting={deleting === item.id}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}

      {modal && (
        <CreateSurveyModal
          onClose={() => setModal(false)}
          onCreated={(item) => setItems((p) => [item, ...p])}
        />
      )}
    </div>
  );
}

function SurveyCard({ item, deleting, onDelete }) {
  const expired = item.expiresAt && new Date(item.expiresAt) < new Date();

  /* Breakdown of question types */
  const typeCounts = (item.questions ?? []).reduce((acc, q) => {
    acc[q.type] = (acc[q.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`group bg-ink-800/30 border rounded-xl px-5 py-4 flex gap-4 transition-all ${
      expired ? 'border-ink-800/30 opacity-60' : 'border-ink-700/40 hover:border-ink-600/50'
    }`}>
      {/* Icon */}
      <div className="shrink-0 w-9 h-9 rounded-lg bg-ink-700/40 border border-ink-600/40 flex items-center justify-center text-ink-400 text-sm">
        ◎
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="text-sm font-arabic font-medium text-ink-100 flex-1">{item.title}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            {item.autoPresent && <Badge color="teal">Auto</Badge>}
            {item.allowSkip   && <Badge color="gray">Skip</Badge>}
            {expired          && <Badge color="red">منتهي</Badge>}
          </div>
        </div>

        {item.description && (
          <p className="text-xs text-ink-500 font-arabic mt-1 line-clamp-1">{item.description}</p>
        )}

        {/* Question type pills */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          <span className="text-[10px] font-mono text-ink-600">
            {item.questions?.length ?? 0} سؤال
          </span>
          {Object.entries(typeCounts).map(([type, count]) => (
            <span key={type} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink-700/40 text-ink-500 border border-ink-700/30">
              {TYPE_SHORT[type] ?? type} ×{count}
            </span>
          ))}
          <span className="text-[10px] font-mono text-ink-700 mr-1">
            {formatDate(item.publishedAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <ActionBtn
          onClick={onDelete}
          disabled={deleting}
          className="text-ink-600 hover:text-red-400"
          title="حذف"
        >
          {deleting ? '…' : '✕'}
        </ActionBtn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   APP SETTINGS TAB (placeholder — extensible)
═══════════════════════════════════════════════════════════════════════════════ */
function AppSettingsTab() {
  return (
    <div className="rounded-2xl border border-ink-700/30 bg-ink-800/20 px-8 py-12 text-center space-y-3">
      <div className="w-12 h-12 rounded-xl bg-ink-800/60 border border-ink-700/40 flex items-center justify-center text-xl text-ink-600 mx-auto">
        ⚙
      </div>
      <p className="text-sm font-arabic font-medium text-ink-400">إعدادات التطبيق</p>
      <p className="text-xs text-ink-600 font-arabic max-w-xs mx-auto">
        هنا ستُضاف إعدادات التطبيق العامة — Feature Flags، إعدادات الجولات التعريفية، والمزيد.
      </p>
      <span className="inline-block text-[10px] font-mono px-2 py-1 rounded border border-ink-700/40 text-ink-700">
        COMING SOON
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SHARED UI HELPERS
═══════════════════════════════════════════════════════════════════════════════ */
const BADGE_COLOR = {
  amber: 'bg-amber-900/30 border-amber-700/40 text-amber-400',
  blue:  'bg-blue-900/30 border-blue-700/40 text-blue-400',
  teal:  'bg-teal-900/30 border-teal-700/40 text-teal-400',
  gray:  'bg-ink-700/40 border-ink-600/40 text-ink-400',
  red:   'bg-red-900/30 border-red-700/40 text-red-400',
};

function Badge({ color = 'gray', children }) {
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${BADGE_COLOR[color]}`}>
      {children}
    </span>
  );
}

function ActionBtn({ onClick, disabled, className, title, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-lg hover:bg-ink-700/50 text-sm transition-all disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

function LoadingGrid() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-20 rounded-xl bg-ink-800/30 border border-ink-700/30 animate-pulse" />
      ))}
    </div>
  );
}

function ErrorBanner({ msg, onRetry }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm font-arabic">
      <span>{msg}</span>
      <button onClick={onRetry} className="text-xs font-mono hover:text-red-300 transition-colors">
        إعادة المحاولة
      </button>
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