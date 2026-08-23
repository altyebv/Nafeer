'use client';
import { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from './ui/shared';

// ─── Design tokens (matches rest of admin dashboard) ─────────────────────────
const T = {
  surface:      'rgba(255,255,255,0.025)',
  surfaceHover: 'rgba(255,255,255,0.04)',
  sunken:       'rgba(0,0,0,0.25)',
  overlay:      '#0e0c09',
  accent:       '#d4891e',
  accentFaint:  'rgba(212,137,30,0.08)',
  accentBorder: 'rgba(212,137,30,0.22)',
  accentText:   '#e8a93a',
  border:       'rgba(255,255,255,0.07)',
  borderSub:    'rgba(255,255,255,0.04)',
  textPrimary:   'rgba(255,255,255,0.88)',
  textSecondary: 'rgba(255,255,255,0.45)',
  textMuted:     'rgba(255,255,255,0.22)',
  green:        '#34d399',
  greenBg:      'rgba(52,211,153,0.08)',
  greenBorder:  'rgba(52,211,153,0.2)',
  amber:        '#fbbf24',
  amberBg:      'rgba(251,191,36,0.08)',
  amberBorder:  'rgba(251,191,36,0.2)',
  red:          '#f87171',
  redBg:        'rgba(248,113,113,0.08)',
  redBorder:    'rgba(248,113,113,0.2)',
  blue:         '#60a5fa',
  blueBg:       'rgba(96,165,250,0.08)',
  blueBorder:   'rgba(96,165,250,0.2)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Avatar({ url, name, size = 32 }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return url ? (
    <img
      src={url}
      alt={name}
      style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', border: `1px solid ${T.border}`,
        flexShrink: 0,
      }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: T.accentFaint, border: `1px solid ${T.accentBorder}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, color: T.accentText, fontWeight: 600,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }) {
  if (role === 'leader') return (
    <span style={{
      fontSize: 11, padding: '2px 7px', borderRadius: 20,
      background: T.amberBg, border: `1px solid ${T.amberBorder}`,
      color: T.amber, fontFamily: 'monospace', letterSpacing: '0.03em',
    }}>
      ⭑ قائد
    </span>
  );
  return (
    <span style={{
      fontSize: 11, padding: '2px 7px', borderRadius: 20,
      background: T.surface, border: `1px solid ${T.border}`,
      color: T.textMuted, fontFamily: 'monospace',
    }}>
      عضو
    </span>
  );
}

// ─── Create Team Modal ────────────────────────────────────────────────────────
function CreateTeamModal({ onClose, onCreated }) {
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [subject,     setSubject]     = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { setError('اسم الفريق مطلوب'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), subject: subject.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'حدث خطأ'); return; }
      onCreated(data.team);
    } catch { setError('حدث خطأ في الاتصال'); }
    finally  { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 10,
    background: T.sunken, border: `1px solid ${T.border}`,
    color: T.textPrimary, fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#111009', border: `1px solid ${T.border}`,
        borderRadius: 16, padding: 28, width: 400, direction: 'rtl',
      }}>
        <h3 style={{ color: T.textPrimary, fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
          إنشاء فريق جديد
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textMuted, display: 'block', marginBottom: 6 }}>اسم الفريق *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="مثال: فريق الرياضيات" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textMuted, display: 'block', marginBottom: 6 }}>وصف مختصر</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} placeholder="اختياري" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textMuted, display: 'block', marginBottom: 6 }}>المادة الدراسية</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle} placeholder="مثال: math (اختياري)" />
          </div>
        </div>

        {error && (
          <p style={{ fontSize: 12, color: T.red, marginTop: 10 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: 10, fontSize: 12,
              background: 'transparent', border: `1px solid ${T.border}`,
              color: T.textSecondary, cursor: 'pointer',
            }}
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '8px 18px', borderRadius: 10, fontSize: 12,
              background: T.accentFaint, border: `1px solid ${T.accentBorder}`,
              color: T.accentText, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'جارٍ الإنشاء…' : 'إنشاء الفريق'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({ team, allContributors, onClose, onUpdated }) {
  const [search,   setSearch]   = useState('');
  const [teamRole, setTeamRole] = useState('member');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const teamMemberIds = new Set(team.members.map((m) => m.contributorId?.toString()));

  const available = allContributors.filter(
    (c) =>
      c.status === 'approved' &&
      !teamMemberIds.has(c._id?.toString()) &&
      (
        !search.trim() ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.username?.toLowerCase().includes(search.toLowerCase())
      )
  );

  const add = async (contributorId) => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`/api/admin/teams/${team._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_member', contributorId, teamRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'حدث خطأ'); return; }
      onUpdated(data.team);
    } catch { setError('حدث خطأ في الاتصال'); }
    finally  { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#111009', border: `1px solid ${T.border}`,
        borderRadius: 16, padding: 24, width: 420, direction: 'rtl',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      }}>
        <h3 style={{ color: T.textPrimary, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
          إضافة عضو إلى {team.name}
        </h3>

        {/* Role selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { value: 'member', label: 'عضو' },
            { value: 'leader', label: '⭑ قائد' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTeamRole(value)}
              style={{
                padding: '5px 14px', borderRadius: 8, fontSize: 12,
                background: teamRole === value ? T.accentFaint : T.surface,
                border: `1px solid ${teamRole === value ? T.accentBorder : T.border}`,
                color: teamRole === value ? T.accentText : T.textSecondary,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن مساهم…"
          style={{
            padding: '8px 12px', borderRadius: 10,
            background: T.sunken, border: `1px solid ${T.border}`,
            color: T.textPrimary, fontSize: 12, outline: 'none',
            marginBottom: 12,
          }}
        />

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {available.length === 0 && (
            <p style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: 20 }}>
              لا يوجد مساهمون متاحون
            </p>
          )}
          {available.map((c) => (
            <div
              key={c._id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 10,
                background: T.surface, border: `1px solid ${T.border}`,
              }}
            >
              <Avatar url={c.avatarUrl} name={c.name} size={30} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, color: T.textPrimary, margin: 0 }}>{c.name}</p>
                <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>@{c.username || '—'}</p>
              </div>
              <button
                onClick={() => add(c._id)}
                disabled={loading}
                style={{
                  padding: '4px 12px', borderRadius: 8, fontSize: 11,
                  background: T.accentFaint, border: `1px solid ${T.accentBorder}`,
                  color: T.accentText, cursor: 'pointer',
                }}
              >
                إضافة
              </button>
            </div>
          ))}
        </div>

        {error && <p style={{ fontSize: 12, color: T.red, marginTop: 8 }}>{error}</p>}

        <button
          onClick={onClose}
          style={{
            marginTop: 14, padding: '7px', borderRadius: 10, fontSize: 12,
            background: 'transparent', border: `1px solid ${T.border}`,
            color: T.textSecondary, cursor: 'pointer',
          }}
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────
function TeamCard({ team, allContributors, onUpdate, onDelete }) {
  const [expanded,    setExpanded]    = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingInfo,  setEditingInfo]  = useState(false);
  const [editName,     setEditName]     = useState(team.name);
  const [editDesc,     setEditDesc]     = useState(team.description);

  const leader = team.members.find((m) => m.teamRole === 'leader');

  const doAction = async (action, extra = {}) => {
    setActionLoading(action + (extra.contributorId || ''));
    try {
      const res  = await fetch(`/api/admin/teams/${team._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data.team);
    } finally { setActionLoading(null); }
  };

  const saveInfo = async () => {
    await doAction('update_info', { name: editName, description: editDesc });
    setEditingInfo(false);
  };

  const deleteTeam = async () => {
    if (!confirm(`هل أنت متأكد من حذف فريق "${team.name}"؟`)) return;
    const res = await fetch(`/api/admin/teams/${team._id}`, { method: 'DELETE' });
    if (res.ok) onDelete(team._id);
  };

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 14, overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer',
      }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Team icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: T.accentFaint, border: `1px solid ${T.accentBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>
          ◉
        </div>

        <div style={{ flex: 1 }}>
          {editingInfo ? (
            <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 13,
                  background: T.sunken, border: `1px solid ${T.accentBorder}`,
                  color: T.textPrimary, outline: 'none',
                }}
              />
              <input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="وصف الفريق (اختياري)"
                style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 12,
                  background: T.sunken, border: `1px solid ${T.border}`,
                  color: T.textSecondary, outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={saveInfo}
                  style={{
                    padding: '3px 12px', borderRadius: 7, fontSize: 11,
                    background: T.accentFaint, border: `1px solid ${T.accentBorder}`,
                    color: T.accentText, cursor: 'pointer',
                  }}
                >
                  حفظ
                </button>
                <button
                  onClick={() => setEditingInfo(false)}
                  style={{
                    padding: '3px 12px', borderRadius: 7, fontSize: 11,
                    background: 'transparent', border: `1px solid ${T.border}`,
                    color: T.textMuted, cursor: 'pointer',
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                  {team.name}
                </span>
                {team.subject && (
                  <span style={{
                    fontSize: 11, padding: '2px 7px', borderRadius: 20,
                    background: T.blueBg, border: `1px solid ${T.blueBorder}`,
                    color: T.blue,
                  }}>
                    {team.subject}
                  </span>
                )}
              </div>
              {team.description && (
                <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{team.description}</p>
              )}
            </>
          )}
        </div>

        {/* Stats + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: 11, color: T.textMuted }}>
            {team.members.length} عضو
          </span>
          {leader && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Avatar url={leader.contributor?.avatarUrl} name={leader.contributor?.name} size={22} />
              <span style={{ fontSize: 11, color: T.amber }}>قائد</span>
            </div>
          )}
          <button
            onClick={() => setEditingInfo(true)}
            style={{
              padding: '3px 8px', borderRadius: 7, fontSize: 11,
              background: 'transparent', border: `1px solid ${T.border}`,
              color: T.textMuted, cursor: 'pointer',
            }}
          >
            ✎
          </button>
          <button
            onClick={deleteTeam}
            style={{
              padding: '3px 8px', borderRadius: 7, fontSize: 11,
              background: 'transparent', border: `1px solid ${T.border}`,
              color: T.textMuted, cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.red; e.currentTarget.style.borderColor = T.redBorder; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.borderColor = T.border; }}
          >
            ✕
          </button>
          <span style={{ fontSize: 12, color: T.textMuted, transform: expanded ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }}>
            ▾
          </span>
        </div>
      </div>

      {/* Members list */}
      {expanded && (
        <div style={{
          borderTop: `1px solid ${T.border}`,
          padding: '14px 18px',
        }}>
          {team.members.length === 0 ? (
            <p style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: '8px 0' }}>
              لا يوجد أعضاء — أضف أول عضو
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {team.members.map((m) => (
                <div
                  key={m.contributorId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                    background: T.sunken, border: `1px solid ${T.borderSub}`,
                  }}
                >
                  <Avatar url={m.contributor?.avatarUrl} name={m.contributor?.name} size={30} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: T.textPrimary, margin: 0 }}>
                      {m.contributor?.name || 'مساهم غير معروف'}
                    </p>
                    <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
                      @{m.contributor?.username || '—'}
                    </p>
                  </div>
                  <RoleBadge role={m.teamRole} />

                  {/* Toggle role */}
                  <button
                    onClick={() => doAction('set_role', {
                      contributorId: m.contributorId,
                      teamRole: m.teamRole === 'leader' ? 'member' : 'leader',
                    })}
                    disabled={!!actionLoading}
                    style={{
                      padding: '3px 10px', borderRadius: 7, fontSize: 11,
                      background: 'transparent', border: `1px solid ${T.border}`,
                      color: T.textMuted, cursor: 'pointer',
                    }}
                    title={m.teamRole === 'leader' ? 'تحويل إلى عضو' : 'ترقية إلى قائد'}
                  >
                    {m.teamRole === 'leader' ? '↓' : '⭑'}
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => doAction('remove_member', { contributorId: m.contributorId })}
                    disabled={!!actionLoading}
                    style={{
                      padding: '3px 8px', borderRadius: 7, fontSize: 11,
                      background: 'transparent', border: `1px solid ${T.border}`,
                      color: T.textMuted, cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = T.red; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; }}
                    title="إزالة من الفريق"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setAddingMember(true)}
            style={{
              padding: '7px 16px', borderRadius: 10, fontSize: 12,
              background: T.accentFaint, border: `1px solid ${T.accentBorder}`,
              color: T.accentText, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>+</span> إضافة عضو
          </button>

          {addingMember && (
            <AddMemberModal
              team={team}
              allContributors={allContributors}
              onClose={() => setAddingMember(false)}
              onUpdated={(updated) => { onUpdate(updated); setAddingMember(false); }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── TeamsSection ─────────────────────────────────────────────────────────────
export function TeamsSection({ allContributors }) {
  const [teams,       setTeams]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin/teams');
      const data = await res.json();
      if (res.ok) setTeams(data.teams || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (team) => {
    setTeams((prev) => [team, ...prev]);
    setShowCreate(false);
  };

  const handleUpdate = (updated) => {
    setTeams((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  };

  const handleDelete = (id) => {
    setTeams((prev) => prev.filter((t) => t._id !== id));
  };

  return (
    <div style={{ padding: '28px 32px', direction: 'rtl', maxWidth: 860 }}>
      <SectionHeader
        title="الفرق"
        description="أنشئ الفرق وأدر أعضاءها وحدد قائد كل فريق"
        action={
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '7px 16px', borderRadius: 10, fontSize: 12,
              background: T.accentFaint, border: `1px solid ${T.accentBorder}`,
              color: T.accentText, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> فريق جديد
          </button>
        }
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: T.textMuted, fontSize: 13 }}>
          جارٍ التحميل…
        </div>
      ) : teams.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: T.surface, border: `1px dashed ${T.border}`,
          borderRadius: 16, color: T.textMuted,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◉</div>
          <p style={{ fontSize: 14, marginBottom: 4 }}>لا توجد فرق بعد</p>
          <p style={{ fontSize: 12 }}>أنشئ أول فريق لتنظيم المساهمين حول المواد الدراسية</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {teams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              allContributors={allContributors}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTeamModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}