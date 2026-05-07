'use client';
import { useState, useEffect, useRef } from 'react';

// ─── Theme — matches the editor's CSS variable system ─────────────────────────
// The editor wraps content in a div with CSS vars set; we reference them via
// inline fallbacks so the page also works standalone if variables aren't injected.
const C = {
  bg:           'var(--bg-main,      #0d0b08)',
  card:         'var(--bg-card,      rgba(255,255,255,0.03))',
  border:       'var(--border,       rgba(255,255,255,0.07))',
  borderActive: 'var(--border-focus, rgba(212,138,30,0.35))',
  accent:       'var(--accent,       #d48a1e)',
  accentFaint:  'rgba(212,138,30,0.07)',
  accentBorder: 'rgba(212,138,30,0.22)',
  accentText:   '#e8a93a',
  text:         'var(--text-primary,   rgba(255,255,255,0.88))',
  textSub:      'var(--text-secondary, rgba(255,255,255,0.45))',
  textMuted:    'var(--text-muted,     rgba(255,255,255,0.22))',
  sunken:       'rgba(0,0,0,0.2)',
  red:          '#f87171',
  redFaint:     'rgba(248,113,113,0.08)',
  redBorder:    'rgba(248,113,113,0.2)',
  green:        '#34d399',
  greenFaint:   'rgba(52,211,153,0.07)',
  greenBorder:  'rgba(52,211,153,0.2)',
  amber:        '#fbbf24',
};

// ─── Shared input style ───────────────────────────────────────────────────────
const inputBase = {
  width: '100%', padding: '10px 13px', borderRadius: 10,
  background: C.sunken, border: `1px solid ${C.border}`,
  color: C.text, fontSize: 13, outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
  fontFamily: 'inherit',
};

// ─── FieldLabel ───────────────────────────────────────────────────────────────
function FieldLabel({ children, hint }) {
  return (
    <label style={{ display: 'block', marginBottom: 7 }}>
      <span style={{ fontSize: 11, color: C.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
        {children}
      </span>
      {hint && (
        <span style={{ fontSize: 11, color: C.textMuted, marginRight: 6, opacity: 0.7 }}>{hint}</span>
      )}
    </label>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  const isErr = type === 'error';
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      padding: '10px 20px', borderRadius: 12, fontSize: 13,
      background: isErr ? C.redFaint : C.greenFaint,
      border: `1px solid ${isErr ? C.redBorder : C.greenBorder}`,
      color: isErr ? C.red : C.green,
      zIndex: 100, pointerEvents: 'none',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      {msg}
    </div>
  );
}

// ─── Avatar picker ────────────────────────────────────────────────────────────
function AvatarPicker({ currentUrl, name, onUploaded, onRemoved }) {
  const fileRef   = useRef(null);
  const [preview, setPreview]  = useState(currentUrl);
  const [loading, setLoading]  = useState(false);
  const [error,   setError]    = useState('');

  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setLoading(true);

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const form = new FormData();
    form.append('avatar', file);

    try {
      const res  = await fetch('/api/contributor/avatar', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'فشل الرفع'); setPreview(currentUrl); return; }
      setPreview(data.avatarUrl);
      onUploaded(data.avatarUrl);
    } catch { setError('حدث خطأ في الاتصال'); setPreview(currentUrl); }
    finally  { setLoading(false); }
  };

  const handleRemove = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/contributor/avatar', { method: 'DELETE' });
      if (res.ok) { setPreview(null); onRemoved(); }
    } catch { setError('حدث خطأ'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      {/* Avatar display */}
      <div
        onClick={() => !loading && fileRef.current?.click()}
        style={{
          position: 'relative', width: 80, height: 80, borderRadius: '50%',
          cursor: loading ? 'not-allowed' : 'pointer',
          flexShrink: 0,
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt={name}
            style={{
              width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
              border: `2px solid ${C.accentBorder}`,
            }}
          />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: C.accentFaint, border: `2px solid ${C.accentBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, color: C.accentText, fontWeight: 700,
          }}>
            {initials}
          </div>
        )}
        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: loading ? 1 : 0,
          transition: 'opacity 0.15s',
          fontSize: 18, color: '#fff',
        }}>
          {loading ? '…' : '📷'}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          style={{
            padding: '6px 14px', borderRadius: 9, fontSize: 12,
            background: C.accentFaint, border: `1px solid ${C.accentBorder}`,
            color: C.accentText, cursor: 'pointer',
          }}
        >
          {loading ? 'جارٍ الرفع…' : 'تغيير الصورة'}
        </button>
        {preview && (
          <button
            onClick={handleRemove}
            disabled={loading}
            style={{
              padding: '6px 14px', borderRadius: 9, fontSize: 12,
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.textMuted, cursor: 'pointer',
            }}
          >
            إزالة الصورة
          </button>
        )}
        <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>
          JPEG · PNG · WebP — حد أقصى 5 ميغا
        </p>
        {error && <p style={{ fontSize: 11, color: C.red, margin: 0 }}>{error}</p>}
      </div>
    </div>
  );
}

// ─── ProfileSection ───────────────────────────────────────────────────────────
// A self-contained card for editing a group of fields.
function ProfileSection({ title, children }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: '20px 24px', marginBottom: 16,
    }}>
      <h3 style={{
        fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase',
        letterSpacing: '0.08em', color: C.textMuted, marginBottom: 18, margin: 0, marginBottom: 18,
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────
export default function ProfilePage({ user }) {
  // Profile state
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  // Edit buffers
  const [name,     setName]     = useState('');
  const [username, setUsername] = useState('');
  const [bio,      setBio]      = useState('');

  // Saving states
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState({ msg: '', type: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 2800);
  };

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/contributor/profile');
        const data = await res.json();
        if (res.ok && data.profile) {
          const p = data.profile;
          setProfile(p);
          setName(p.name     || '');
          setUsername(p.username || '');
          setBio(p.bio       || '');
        }
      } finally { setLoading(false); }
    })();
  }, []);

  // ── Save profile fields ──────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true);
    try {
      const res  = await fetch('/api/contributor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, bio }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'فشل الحفظ', 'error'); return; }
      setProfile((p) => ({ ...p, ...data.profile }));
      showToast('تم حفظ الملف الشخصي');
    } catch { showToast('حدث خطأ في الاتصال', 'error'); }
    finally  { setSaving(false); }
  };

  const isDirty =
    profile &&
    (name !== (profile.name || '') ||
     username !== (profile.username || '') ||
     bio !== (profile.bio || ''));

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 300, color: C.textMuted, fontSize: 13,
      }}>
        جارٍ التحميل…
      </div>
    );
  }

  const bioRemaining = 280 - bio.length;

  return (
    <div style={{
      maxWidth: 580, margin: '0 auto', padding: '28px 24px',
      direction: 'rtl', color: C.text,
    }}>
      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          الملف الشخصي
        </h1>
        <p style={{ fontSize: 12, color: C.textMuted }}>
          أدر معلوماتك ومظهرك أمام الفريق
        </p>
      </div>

      {/* ── Avatar ─────────────────────────────────────────────────────────── */}
      <ProfileSection title="صورة الملف الشخصي">
        <AvatarPicker
          currentUrl={profile?.avatarUrl}
          name={profile?.name}
          onUploaded={(url) => setProfile((p) => ({ ...p, avatarUrl: url }))}
          onRemoved={() => setProfile((p) => ({ ...p, avatarUrl: null }))}
        />
      </ProfileSection>

      {/* ── Identity ────────────────────────────────────────────────────────── */}
      <ProfileSection title="المعلومات الأساسية">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Name */}
          <div>
            <FieldLabel>الاسم الكامل</FieldLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputBase}
              onFocus={(e)  => { e.target.style.borderColor = C.borderActive; }}
              onBlur={(e)   => { e.target.style.borderColor = C.border; }}
              placeholder="اسمك الكامل"
            />
          </div>

          {/* Username */}
          <div>
            <FieldLabel hint="3-20 حرف، أحرف وأرقام و _ . -">اسم المستخدم</FieldLabel>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 13, color: C.textMuted, pointerEvents: 'none',
              }}>
                @
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                style={{ ...inputBase, paddingRight: 28 }}
                onFocus={(e)  => { e.target.style.borderColor = C.borderActive; }}
                onBlur={(e)   => { e.target.style.borderColor = C.border; }}
                placeholder="username"
                dir="ltr"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <FieldLabel hint={`${bio.length}/280`}>نبذة تعريفية</FieldLabel>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 280))}
              rows={3}
              style={{
                ...inputBase,
                resize: 'vertical', lineHeight: 1.6,
                minHeight: 80,
              }}
              onFocus={(e)  => { e.target.style.borderColor = C.borderActive; }}
              onBlur={(e)   => { e.target.style.borderColor = C.border; }}
              placeholder="اكتب نبذة قصيرة عن نفسك…"
            />
            {bioRemaining < 40 && (
              <p style={{
                fontSize: 11, marginTop: 4,
                color: bioRemaining <= 0 ? C.red : C.amber,
              }}>
                {bioRemaining} حرف متبقٍّ
              </p>
            )}
          </div>
        </div>

        {/* Save button */}
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button
            onClick={saveProfile}
            disabled={saving || !isDirty}
            style={{
              padding: '9px 22px', borderRadius: 10, fontSize: 13,
              background: isDirty && !saving ? C.accentFaint : 'transparent',
              border: `1px solid ${isDirty && !saving ? C.accentBorder : C.border}`,
              color: isDirty && !saving ? C.accentText : C.textMuted,
              cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
          </button>
          {isDirty && (
            <button
              onClick={() => {
                setName(profile.name || '');
                setUsername(profile.username || '');
                setBio(profile.bio || '');
              }}
              style={{
                padding: '9px 16px', borderRadius: 10, fontSize: 13,
                background: 'transparent', border: `1px solid ${C.border}`,
                color: C.textMuted, cursor: 'pointer',
              }}
            >
              إلغاء
            </button>
          )}
        </div>
      </ProfileSection>

      {/* ── Read-only info ────────────────────────────────────────────────── */}
      <ProfileSection title="بيانات الحساب">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'البريد الإلكتروني', value: profile?.email },
            { label: 'المادة المسندة',    value: profile?.subject || '—' },
            { label: 'الدور',             value: profile?.roleId?.name || profile?.role || '—' },
            { label: 'تاريخ الانضمام',   value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'baseline', gap: 8,
              padding: '8px 12px', borderRadius: 10,
              background: C.sunken, border: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 11, color: C.textMuted, minWidth: 110, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: C.textSub }}>{value}</span>
            </div>
          ))}
        </div>
      </ProfileSection>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      {profile?.stats && (
        <ProfileSection title="إحصائياتك">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { key: 'lessonsCreated',   label: 'دروس أُنشئت' },
              { key: 'questionsAdded',   label: 'أسئلة مضافة' },
              { key: 'blocksAdded',      label: 'مقاطع مضافة' },
              { key: 'reviewsSubmitted', label: 'مراجعات' },
              { key: 'publishedLessons', label: 'نُشرت' },
              { key: 'feedItemsCreated', label: 'تغذية' },
            ].map(({ key, label }) => (
              <div key={key} style={{
                padding: '12px 14px', borderRadius: 10,
                background: C.sunken, border: `1px solid ${C.border}`,
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: C.accentText, margin: 0 }}>
                  {profile.stats[key] ?? 0}
                </p>
                <p style={{ fontSize: 10, color: C.textMuted, margin: '4px 0 0', fontFamily: 'monospace' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}