'use client';
import { useState, useEffect } from 'react';
import { SectionHeader } from './ui/shared';

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, loading }) {
  return (
    <button
      onClick={() => !loading && onChange(!checked)}
      className="relative shrink-0 transition-all duration-300"
      style={{
        width: 44, height: 24,
        borderRadius: 12,
        background: checked ? 'var(--accent, #d4891e)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${checked ? 'rgba(212,137,30,0.5)' : 'rgba(255,255,255,0.12)'}`,
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
      aria-checked={checked}
      role="switch"
    >
      <span
        className="absolute top-0.5 transition-all duration-300"
        style={{
          width: 18, height: 18, borderRadius: '50%',
          background: checked ? '#0e0c09' : 'rgba(255,255,255,0.35)',
          right: checked ? 3 : 'auto',
          left:  checked ? 'auto' : 3,
          top: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );
}

// ── Setting row ───────────────────────────────────────────────────────────────
function SettingRow({ label, description, checked, onChange, loading }) {
  return (
    <div
      className="flex items-center justify-between gap-6 px-5 py-4 rounded-xl transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
    >
      <div>
        <p className="text-sm font-arabic text-ink-100 font-medium">{label}</p>
        {description && (
          <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} loading={loading} />
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export function SiteSettingsSection() {
  const [settings, setSettings] = useState({ showContributorsOnLanding: true });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(null); // key being saved
  const [toast,    setToast]    = useState(null);

  useEffect(() => {
    fetch('/api/admin/site-settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setSettings(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const update = async (key, value) => {
    setSaving(key);
    const prev = settings[key];
    setSettings((s) => ({ ...s, [key]: value })); // optimistic

    const res  = await fetch('/api/admin/site-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    });
    const data = await res.json();

    setSaving(null);
    if (data.ok) {
      showToast('تم الحفظ ✓');
    } else {
      setSettings((s) => ({ ...s, [key]: prev })); // revert
      showToast('حدث خطأ — لم يُحفظ');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div>
      <SectionHeader
        title="إعدادات الموقع"
        description="تحكم في ما يظهر وما يُخفى في الصفحة الرئيسية"
      />

      <div className="px-8 pb-8 max-w-2xl">
        {loading ? (
          <div className="flex items-center gap-3 text-ink-500 text-sm py-8">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-ink-700 border-t-sand-400 rounded-full" />
            جارٍ التحميل…
          </div>
        ) : (
          <div className="space-y-3">
            {/* Section label */}
            <p className="text-xs font-mono text-ink-600 uppercase tracking-widest mb-4">
              الصفحة الرئيسية
            </p>

            <SettingRow
              label="قسم المساهمين (قاعة الشرف)"
              description="عند التفعيل، يظهر قسم أعمدة المشروع في الصفحة الرئيسية مع بيانات المساهمين المعتمدين."
              checked={settings.showContributorsOnLanding}
              onChange={(v) => update('showContributorsOnLanding', v)}
              loading={saving === 'showContributorsOnLanding'}
            />
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-mono shadow-2xl z-50 transition-all"
            style={{
              background: 'rgba(20,18,14,0.95)',
              border: '1px solid rgba(212,137,30,0.3)',
              color: 'var(--accent, #d4891e)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}