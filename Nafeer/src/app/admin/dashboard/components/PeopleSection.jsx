'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { SetPasswordModal } from './modals/SetPasswordModal';
import { RoleModal } from './modals/RoleModal';
import { ActiveCard, RequestCard } from './ContributorCard';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
    bg: '#09080600',
    surface: 'rgba(255,255,255,0.025)',
    surfaceHover: 'rgba(255,255,255,0.04)',
    surfaceMid: 'rgba(255,255,255,0.035)',
    sunken: 'rgba(0,0,0,0.3)',
    panel: '#0d0b08',

    accent: '#d48a1e',
    accentFaint: 'rgba(212,138,30,0.07)',
    accentMid: 'rgba(212,138,30,0.13)',
    accentBorder: 'rgba(212,138,30,0.22)',
    accentText: '#e8a93a',

    border: 'rgba(255,255,255,0.06)',
    borderMid: 'rgba(255,255,255,0.10)',

    text: 'rgba(255,255,255,0.88)',
    textSub: 'rgba(255,255,255,0.50)',
    textMuted: 'rgba(255,255,255,0.22)',

    green: '#34d399',
    greenBg: 'rgba(52,211,153,0.07)',
    greenBorder: 'rgba(52,211,153,0.18)',

    amber: '#fbbf24',
    amberBg: 'rgba(251,191,36,0.07)',
    amberBorder: 'rgba(251,191,36,0.18)',

    red: '#f87171',
    redBg: 'rgba(248,113,113,0.07)',
    redBorder: 'rgba(248,113,113,0.18)',

    blue: '#60a5fa',
    blueBg: 'rgba(96,165,250,0.07)',
    blueBorder: 'rgba(96,165,250,0.18)',

    purple: '#a78bfa',
    purpleBg: 'rgba(167,139,250,0.07)',
    purpleBorder: 'rgba(167,139,250,0.18)',

    teal: '#2dd4bf',
    tealBg: 'rgba(45,212,191,0.07)',
    tealBorder: 'rgba(45,212,191,0.18)',
};

// ─── Role category meta ────────────────────────────────────────────────────────
const CAT_META = {
    learning: { label: 'تجربة تعليمية', icon: '◈', color: C.amber, bg: C.amberBg, border: C.amberBorder },
    core: { label: 'بناء المنصة', icon: '⬡', color: C.blue, bg: C.blueBg, border: C.blueBorder },
    growth: { label: 'نشر الفكرة', icon: '◉', color: C.purple, bg: C.purpleBg, border: C.purpleBorder },
    operations: { label: 'تنظيم نفير', icon: '▦', color: C.teal, bg: C.tealBg, border: C.tealBorder },
    content: { label: 'محتوى', icon: '◈', color: C.amber, bg: C.amberBg, border: C.amberBorder },
    development: { label: 'تطوير', icon: '⬡', color: C.blue, bg: C.blueBg, border: C.blueBorder },
    design: { label: 'تصميم', icon: '◇', color: C.purple, bg: C.purpleBg, border: C.purpleBorder },
};
const CAT_ORDER = ['learning', 'core', 'growth', 'operations', 'content', 'development', 'design'];

const REQUEST_STAGES = [
    { key: 'all', label: 'الكل' },
    { key: 'new', label: 'جديد' },
    { key: 'sent', label: 'بانتظار المقابلة' },
    { key: 'answered', label: 'أكمل المقابلة' },
    { key: 'rejected', label: 'مرفوض' },
];

// ─── Tiny helpers ──────────────────────────────────────────────────────────────
function matchStage(c, key) {
    if (key === 'all') return c.status === 'pending' || c.status === 'rejected';
    if (key === 'rejected') return c.status === 'rejected';
    if (c.status !== 'pending') return false;
    const done = c.interviewAnswers?.submittedAt || c.dynamicAnswersSubmittedAt;
    if (key === 'new') return !c.interviewToken && !done;
    if (key === 'sent') return !!c.interviewToken && !done;
    if (key === 'answered') return !!done;
    return false;
}

function matchSearch(c, q) {
    if (!q) return true;
    const l = q.toLowerCase();
    return c.name?.toLowerCase().includes(l) || c.email?.toLowerCase().includes(l) || c.username?.toLowerCase().includes(l);
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function Stat({ label, value, color = C.textSub }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>{label}</span>
        </div>
    );
}

// ─── Top tab strip ─────────────────────────────────────────────────────────────
function TopNav({ active, onChange, badges }) {
    const tabs = [
        { id: 'contributors', label: 'المساهمون', badge: badges.pending },
        { id: 'teams', label: 'الفرق', badge: null },
        { id: 'roles', label: 'الأدوار', badge: null },
    ];
    return (
        <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'linear-gradient(to bottom, #0a0806 85%, transparent)',
            paddingBottom: 0,
        }}>
            <div style={{
                display: 'flex', alignItems: 'stretch', gap: 0,
                padding: '22px 32px 0',
                borderBottom: `1px solid ${C.border}`,
            }}>
                {tabs.map((t) => {
                    const isActive = t.id === active;
                    return (
                        <button
                            key={t.id}
                            onClick={() => onChange(t.id)}
                            style={{
                                position: 'relative',
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '0 4px 16px',
                                marginLeft: 28,
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: isActive ? C.text : C.textMuted,
                                fontSize: 13,
                                fontWeight: isActive ? 600 : 400,
                                transition: 'color 0.15s',
                            }}
                        >
                            {t.label}
                            {t.badge > 0 && (
                                <span style={{
                                    fontSize: 10, padding: '1px 6px', borderRadius: 20,
                                    background: C.amberBg, border: `1px solid ${C.amberBorder}`,
                                    color: C.accentText, fontVariantNumeric: 'tabular-nums',
                                }}>
                                    {t.badge}
                                </span>
                            )}
                            {isActive && (
                                <span style={{
                                    position: 'absolute', bottom: -1, left: 0, right: 0,
                                    height: 2, borderRadius: 2,
                                    background: `linear-gradient(90deg, ${C.accent}, ${C.accentText})`,
                                }} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Search input ─────────────────────────────────────────────────────────────
function SearchInput({ value, onChange, placeholder = 'بحث…' }) {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ position: 'relative', width: 260 }}>
            <span style={{
                position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, color: C.textMuted, pointerEvents: 'none',
            }}>⌕</span>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    width: '100%', paddingRight: 32, paddingLeft: value ? 28 : 12,
                    paddingTop: 7, paddingBottom: 7,
                    borderRadius: 10, fontSize: 12, outline: 'none', boxSizing: 'border-box',
                    background: focused ? C.accentFaint : C.surface,
                    border: `1px solid ${focused ? C.accentBorder : C.border}`,
                    color: C.text, transition: 'all 0.15s',
                }}
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    style={{
                        position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                        fontSize: 10, color: C.textMuted, background: 'none', border: 'none',
                        cursor: 'pointer', lineHeight: 1, padding: 2,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = C.red; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted; }}
                >✕</button>
            )}
        </div>
    );
}

// ─── Filter chip ─────────────────────────────────────────────────────────────
function Chip({ label, count, active, onClick }) {
    const [hover, setHover] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 8, fontSize: 11,
                cursor: 'pointer', transition: 'all 0.13s',
                background: active ? C.accentMid : hover ? C.surfaceHover : C.surface,
                border: `1px solid ${active ? C.accentBorder : C.border}`,
                color: active ? C.accentText : C.textSub,
            }}
        >
            {label}
            <span style={{
                fontSize: 10, padding: '0 5px', borderRadius: 5,
                background: active ? 'rgba(212,138,30,0.15)' : 'rgba(255,255,255,0.05)',
                color: active ? C.accentText : C.textMuted,
                fontVariantNumeric: 'tabular-nums',
            }}>{count}</span>
        </button>
    );
}

// ─── Alert banner ─────────────────────────────────────────────────────────────
function AlertBanner({ icon, text, color, bg, border }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 14px', borderRadius: 10,
            background: bg, border: `1px solid ${border}`,
        }}>
            <span style={{ fontSize: 13, color }}>{icon}</span>
            <span style={{ fontSize: 12, color }}>{text}</span>
        </div>
    );
}

// ─── Empty placeholder ────────────────────────────────────────────────────────
function Empty({ icon = '◈', text, sub }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8, padding: '56px 0', color: C.textMuted,
            textAlign: 'center',
        }}>
            <span style={{ fontSize: 24, opacity: 0.12 }}>{icon}</span>
            <p style={{ fontSize: 13, color: C.textMuted }}>{text}</p>
            {sub && <p style={{ fontSize: 11, color: C.textMuted, opacity: 0.6, maxWidth: 280 }}>{sub}</p>}
        </div>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ url, name, size = 28, border = true }) {
    const initials = name
        ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';
    return url ? (
        <img src={url} alt={name} style={{
            width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
            border: border ? `1.5px solid rgba(0,0,0,0.4)` : 'none',
        }} />
    ) : (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: C.accentFaint, border: `1.5px solid ${C.accentBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.32, color: C.accentText, fontWeight: 700,
        }}>{initials}</div>
    );
}

// ─── Avatar stack (teams) ─────────────────────────────────────────────────────
function AvatarStack({ members, max = 4 }) {
    const shown = members.slice(0, max);
    const rest = members.length - shown.length;
    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            {shown.map((m, i) => (
                <div key={m.contributorId} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: shown.length - i }}>
                    <Avatar url={m.contributor?.avatarUrl} name={m.contributor?.name} size={26} />
                </div>
            ))}
            {rest > 0 && (
                <div style={{
                    width: 26, height: 26, borderRadius: '50%', marginLeft: -8,
                    background: C.surface, border: `1.5px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: C.textMuted, fontWeight: 600,
                }}>+{rest}</div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRIBUTORS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

function ContributorsScreen({ allContributors, onRefresh }) {
    const [subTab, setSubTab] = useState('requests');
    const [stage, setStage] = useState('all');
    const [search, setSearch] = useState('');
    const [actionLoading, setActLoad] = useState(null);
    const [passwordModal, setPwModal] = useState(null);
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        fetch('/api/admin/roles').then((r) => r.json())
            .then((d) => { if (d.ok) setRoles(d.roles || []); }).catch(() => { });
    }, []);

    const requests = useMemo(() => allContributors.filter((c) => c.status === 'pending' || c.status === 'rejected'), [allContributors]);
    const active = useMemo(() => allContributors.filter((c) => c.status === 'approved'), [allContributors]);

    const stageCounts = useMemo(() => {
        const m = {};
        REQUEST_STAGES.forEach(({ key }) => { m[key] = requests.filter((c) => matchStage(c, key)).length; });
        return m;
    }, [requests]);

    const shownRequests = useMemo(
        () => requests.filter((c) => matchStage(c, stage) && matchSearch(c, search)),
        [requests, stage, search]
    );
    const shownActive = useMemo(
        () => active.filter((c) => matchSearch(c, search)),
        [active, search]
    );

    const act = async (id, action, extra = {}) => {
        if (action === '_noop') { onRefresh(); return; }
        setActLoad(id + action);
        await fetch('/api/admin/contributors', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, action, ...extra }),
        });
        setActLoad(null);
        onRefresh();
    };

    const del = async (id) => {
        setActLoad(id + 'delete');
        await fetch('/api/admin/contributors', {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        setActLoad(null);
        onRefresh();
    };

    const unapprovedCount = active.filter((c) => !c.onboarded).length;
    const noUsernames = active.filter((c) => c.onboarded && !c.username).length;
    const answeredCount = stageCounts['answered'] || 0;

    return (
        <div style={{ padding: '28px 32px 48px', direction: 'rtl', maxWidth: 860 }}>

            {/* ── Stats row ── */}
            <div style={{
                display: 'flex', gap: 28, marginBottom: 28,
                padding: '16px 20px', borderRadius: 14,
                background: C.surface, border: `1px solid ${C.border}`,
            }}>
                <Stat label="إجمالي" value={allContributors.length} color={C.text} />
                <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />
                <Stat label="نشطون" value={active.length} color={C.green} />
                <Stat label="طلبات" value={requests.length} color={C.amber} />
                {answeredCount > 0 && <Stat label="أكملوا المقابلة" value={answeredCount} color={C.accentText} />}
            </div>

            {/* ── Sub-tab selector ── */}
            <div style={{
                display: 'inline-flex', gap: 2, padding: 3,
                borderRadius: 11, marginBottom: 22,
                background: C.sunken, border: `1px solid ${C.border}`,
            }}>
                {[
                    { id: 'requests', label: 'طلبات الانضمام', count: requests.length, alert: answeredCount > 0 },
                    { id: 'active', label: 'المساهمون النشطون', count: active.length, alert: unapprovedCount > 0 },
                ].map((t) => {
                    const isActive = t.id === subTab;
                    const [hover, setHover] = [false, () => { }];
                    return (
                        <button
                            key={t.id}
                            onClick={() => { setSubTab(t.id); setSearch(''); setStage('all'); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '7px 16px', borderRadius: 8, fontSize: 12.5,
                                cursor: 'pointer', transition: 'all 0.13s', position: 'relative',
                                background: isActive ? C.accentFaint : 'transparent',
                                border: `1px solid ${isActive ? C.accentBorder : 'transparent'}`,
                                color: isActive ? C.accentText : C.textSub,
                                fontWeight: isActive ? 600 : 400,
                            }}
                        >
                            {t.label}
                            <span style={{
                                fontSize: 10, padding: '1px 6px', borderRadius: 5,
                                background: isActive ? 'rgba(212,138,30,0.15)' : 'rgba(255,255,255,0.05)',
                                color: isActive ? C.accentText : C.textMuted,
                            }}>{t.count}</span>
                            {t.alert && (
                                <span style={{
                                    position: 'absolute', top: 5, right: 5,
                                    width: 5, height: 5, borderRadius: '50%',
                                    background: C.amber, boxShadow: `0 0 5px ${C.amber}`,
                                }} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── REQUESTS ── */}
            {subTab === 'requests' && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {REQUEST_STAGES.map((s) => (
                                <Chip key={s.key} label={s.label} count={stageCounts[s.key]} active={stage === s.key} onClick={() => setStage(s.key)} />
                            ))}
                        </div>
                        <SearchInput value={search} onChange={setSearch} placeholder="بحث بالاسم أو البريد…" />
                    </div>

                    {shownRequests.length === 0 ? (
                        <Empty icon="◌" text="لا يوجد طلبات في هذه الفئة" />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {shownRequests.map((c) => (
                                <RequestCard key={c._id} c={c} actionLoading={actionLoading} onAct={act} onDelete={del}
                                    onSetPassword={(id, name) => setPwModal({ id, name })} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── ACTIVE ── */}
            {subTab === 'active' && (
                <>
                    {(unapprovedCount > 0 || noUsernames > 0) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                            {unapprovedCount > 0 && (
                                <AlertBanner icon="⚠" text={`${unapprovedCount} مساهم لم يُكمل التأهيل بعد`} color={C.amber} bg={C.amberBg} border={C.amberBorder} />
                            )}
                            {noUsernames > 0 && (
                                <AlertBanner icon="◎" text={`${noUsernames} مساهم بدون username — لن تظهر صفحاتهم العامة`} color={C.accentText} bg={C.accentFaint} border={C.accentBorder} />
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                        <SearchInput value={search} onChange={setSearch} placeholder="بحث بالاسم أو المستخدم…" />
                    </div>

                    {shownActive.length === 0 ? (
                        <Empty text="لا يوجد مساهمون نشطون" />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {shownActive.map((c) => (
                                <ActiveCard key={c._id} c={c} actionLoading={actionLoading} onAct={act} onDelete={del}
                                    roles={roles} onSetPassword={(id, name) => setPwModal({ id, name })} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {passwordModal && (
                <SetPasswordModal
                    name={passwordModal.name}
                    onClose={() => setPwModal(null)}
                    onSave={async (pw) => { await act(passwordModal.id, 'set_password', { password: pw }); setPwModal(null); }}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAMS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Create team modal ─────────────────────────────────────────────────────────
function CreateTeamModal({ onClose, onCreated }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        if (!name.trim()) { setError('اسم الفريق مطلوب'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/admin/teams', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), description: description.trim(), subject: subject.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'حدث خطأ'); return; }
            onCreated(data.team);
        } catch { setError('حدث خطأ في الاتصال'); }
        finally { setLoading(false); }
    };

    const field = {
        width: '100%', padding: '9px 12px', borderRadius: 10,
        background: C.sunken, border: `1px solid ${C.border}`,
        color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{ background: '#100e0b', border: `1px solid ${C.borderMid}`, borderRadius: 18, padding: 28, width: 400, direction: 'rtl' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 20 }}>إنشاء فريق جديد</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 5 }}>اسم الفريق *</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} style={field} placeholder="مثال: فريق الرياضيات" />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 5 }}>وصف مختصر</label>
                        <input value={description} onChange={(e) => setDescription(e.target.value)} style={field} placeholder="اختياري" />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 5 }}>المادة الدراسية</label>
                        <input value={subject} onChange={(e) => setSubject(e.target.value)} style={field} placeholder="مثال: math  (اختياري)" />
                    </div>
                </div>

                {error && <p style={{ fontSize: 12, color: C.red, marginTop: 10 }}>{error}</p>}

                <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{
                        padding: '8px 18px', borderRadius: 10, fontSize: 12,
                        background: 'transparent', border: `1px solid ${C.border}`,
                        color: C.textSub, cursor: 'pointer',
                    }}>إلغاء</button>
                    <button onClick={submit} disabled={loading} style={{
                        padding: '8px 18px', borderRadius: 10, fontSize: 12,
                        background: C.accentFaint, border: `1px solid ${C.accentBorder}`,
                        color: C.accentText, cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                    }}>{loading ? 'جارٍ الإنشاء…' : 'إنشاء الفريق'}</button>
                </div>
            </div>
        </div>
    );
}

// ─── Add member modal ──────────────────────────────────────────────────────────
function AddMemberModal({ team, allContributors, onClose, onUpdated }) {
    const [search, setSearch] = useState('');
    const [teamRole, setTeamRole] = useState('member');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const memberIds = new Set(team.members.map((m) => m.contributorId?.toString()));
    const available = allContributors.filter(
        (c) => c.status === 'approved' && !memberIds.has(c._id?.toString()) &&
            (!search.trim() || c.name?.toLowerCase().includes(search.toLowerCase()) || c.username?.toLowerCase().includes(search.toLowerCase()))
    );

    const add = async (contributorId) => {
        setLoading(true); setError('');
        try {
            const res = await fetch(`/api/admin/teams/${team._id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add_member', contributorId, teamRole }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'حدث خطأ'); return; }
            onUpdated(data.team);
        } catch { setError('حدث خطأ في الاتصال'); }
        finally { setLoading(false); }
    };

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: '#100e0b', border: `1px solid ${C.borderMid}`, borderRadius: 18,
                padding: 24, width: 420, direction: 'rtl', maxHeight: '78vh',
                display: 'flex', flexDirection: 'column',
            }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>إضافة عضو إلى {team.name}</p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    {[{ value: 'member', label: 'عضو' }, { value: 'leader', label: '⭑ قائد' }].map(({ value, label }) => (
                        <button key={value} onClick={() => setTeamRole(value)} style={{
                            padding: '5px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                            background: teamRole === value ? C.accentFaint : C.surface,
                            border: `1px solid ${teamRole === value ? C.accentBorder : C.border}`,
                            color: teamRole === value ? C.accentText : C.textSub,
                        }}>{label}</button>
                    ))}
                </div>

                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن مساهم…"
                    style={{ padding: '8px 12px', borderRadius: 10, background: C.sunken, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, outline: 'none', marginBottom: 12 }} />

                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {available.length === 0 && <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: 20 }}>لا يوجد مساهمون متاحون</p>}
                    {available.map((c) => (
                        <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}` }}>
                            <Avatar url={c.avatarUrl} name={c.name} size={30} />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 12, color: C.text, margin: 0 }}>{c.name}</p>
                                <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>@{c.username || '—'}</p>
                            </div>
                            <button onClick={() => add(c._id)} disabled={loading} style={{
                                padding: '4px 12px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                                background: C.accentFaint, border: `1px solid ${C.accentBorder}`, color: C.accentText,
                            }}>إضافة</button>
                        </div>
                    ))}
                </div>

                {error && <p style={{ fontSize: 12, color: C.red, marginTop: 8 }}>{error}</p>}
                <button onClick={onClose} style={{
                    marginTop: 14, padding: 8, borderRadius: 10, fontSize: 12, cursor: 'pointer',
                    background: 'transparent', border: `1px solid ${C.border}`, color: C.textSub,
                }}>إغلاق</button>
            </div>
        </div>
    );
}

// ─── Team card ────────────────────────────────────────────────────────────────
function TeamCard({ team, allContributors, onUpdate, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [editingInfo, setEditingInfo] = useState(false);
    const [editName, setEditName] = useState(team.name);
    const [editDesc, setEditDesc] = useState(team.description || '');
    const [hover, setHover] = useState(false);

    const leader = team.members.find((m) => m.teamRole === 'leader');

    const doAction = async (action, extra = {}) => {
        setActionLoading(action + (extra.contributorId || ''));
        try {
            const res = await fetch(`/api/admin/teams/${team._id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...extra }),
            });
            const data = await res.json();
            if (res.ok) onUpdate(data.team);
        } finally { setActionLoading(null); }
    };

    const saveInfo = async () => { await doAction('update_info', { name: editName, description: editDesc }); setEditingInfo(false); };
    const deleteTeam = async () => {
        if (!confirm(`هل أنت متأكد من حذف فريق "${team.name}"؟`)) return;
        const res = await fetch(`/api/admin/teams/${team._id}`, { method: 'DELETE' });
        if (res.ok) onDelete(team._id);
    };

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.15s',
                background: C.surface, border: `1px solid ${hover ? C.borderMid : C.border}`,
            }}
        >
            {/* ── Card header ── */}
            <div
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                onClick={() => setExpanded((v) => !v)}
            >
                {/* Icon */}
                <div style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    background: C.accentFaint, border: `1px solid ${C.accentBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17,
                }}>◉</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {editingInfo ? (
                        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{
                                padding: '5px 10px', borderRadius: 8, fontSize: 13, outline: 'none',
                                background: C.sunken, border: `1px solid ${C.accentBorder}`, color: C.text,
                            }} />
                            <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="وصف الفريق" style={{
                                padding: '5px 10px', borderRadius: 8, fontSize: 12, outline: 'none',
                                background: C.sunken, border: `1px solid ${C.border}`, color: C.textSub,
                            }} />
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={saveInfo} style={{ padding: '3px 12px', borderRadius: 7, fontSize: 11, cursor: 'pointer', background: C.accentFaint, border: `1px solid ${C.accentBorder}`, color: C.accentText }}>حفظ</button>
                                <button onClick={() => setEditingInfo(false)} style={{ padding: '3px 12px', borderRadius: 7, fontSize: 11, cursor: 'pointer', background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted }}>إلغاء</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{team.name}</span>
                                {team.subject && (
                                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: C.blueBg, border: `1px solid ${C.blueBorder}`, color: C.blue }}>{team.subject}</span>
                                )}
                            </div>
                            {team.description && <p style={{ fontSize: 11, color: C.textMuted, margin: 0, lineHeight: 1.4 }}>{team.description}</p>}
                        </>
                    )}
                </div>

                {/* Right side: avatars + controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {team.members.length > 0 && <AvatarStack members={team.members} />}
                    <span style={{ fontSize: 11, color: C.textMuted }}>{team.members.length} عضو</span>

                    {leader && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Avatar url={leader.contributor?.avatarUrl} name={leader.contributor?.name} size={20} />
                            <span style={{ fontSize: 10, color: C.amber }}>قائد</span>
                        </div>
                    )}

                    <button onClick={() => setEditingInfo(true)} style={{ padding: '3px 8px', borderRadius: 7, fontSize: 11, background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, cursor: 'pointer' }}>✎</button>
                    <button
                        onClick={deleteTeam}
                        style={{ padding: '3px 8px', borderRadius: 7, fontSize: 11, background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = C.red; e.currentTarget.style.borderColor = C.redBorder; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderColor = C.border; }}
                    >✕</button>
                    <span style={{ fontSize: 11, color: C.textMuted, transform: expanded ? 'rotate(180deg)' : '', transition: 'transform 0.2s', display: 'block' }}>▾</span>
                </div>
            </div>

            {/* ── Members panel ── */}
            {expanded && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 20px' }}>
                    {team.members.length === 0 ? (
                        <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '8px 0' }}>لا يوجد أعضاء — أضف أول عضو</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
                            {team.members.map((m) => (
                                <div key={m.contributorId} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 12px', borderRadius: 10, background: C.sunken, border: `1px solid ${C.border}`,
                                }}>
                                    <Avatar url={m.contributor?.avatarUrl} name={m.contributor?.name} size={28} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 12, color: C.text, margin: 0 }}>{m.contributor?.name || 'مساهم غير معروف'}</p>
                                        <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>@{m.contributor?.username || '—'}</p>
                                    </div>

                                    {/* Leader badge */}
                                    {m.teamRole === 'leader' ? (
                                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: C.amberBg, border: `1px solid ${C.amberBorder}`, color: C.amber }}>⭑ قائد</span>
                                    ) : (
                                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted }}>عضو</span>
                                    )}

                                    {/* Toggle role */}
                                    <button
                                        onClick={() => doAction('set_role', { contributorId: m.contributorId, teamRole: m.teamRole === 'leader' ? 'member' : 'leader' })}
                                        disabled={!!actionLoading}
                                        title={m.teamRole === 'leader' ? 'تحويل إلى عضو' : 'ترقية إلى قائد'}
                                        style={{ padding: '3px 10px', borderRadius: 7, fontSize: 10, background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, cursor: 'pointer' }}
                                    >{m.teamRole === 'leader' ? '↓' : '⭑'}</button>

                                    {/* Remove */}
                                    <button
                                        onClick={() => doAction('remove_member', { contributorId: m.contributorId })}
                                        disabled={!!actionLoading}
                                        title="إزالة من الفريق"
                                        style={{ padding: '3px 8px', borderRadius: 7, fontSize: 10, background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, cursor: 'pointer' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = C.red; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted; }}
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button onClick={() => setShowAddMember(true)} style={{
                        padding: '7px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
                        background: C.accentFaint, border: `1px solid ${C.accentBorder}`, color: C.accentText,
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}>
                        <span>+</span> إضافة عضو
                    </button>

                    {showAddMember && (
                        <AddMemberModal
                            team={team} allContributors={allContributors}
                            onClose={() => setShowAddMember(false)}
                            onUpdated={(updated) => { onUpdate(updated); setShowAddMember(false); }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function TeamsScreen({ allContributors }) {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/teams');
            const data = await res.json();
            if (res.ok) setTeams(data.teams || []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() =>
        !search.trim() ? teams : teams.filter((t) =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.subject?.toLowerCase().includes(search.toLowerCase())
        ), [teams, search]);

    const handleUpdate = (updated) => setTeams((prev) => prev.map((t) => t._id === updated._id ? updated : t));
    const handleDelete = (id) => setTeams((prev) => prev.filter((t) => t._id !== id));

    const totalMembers = teams.reduce((n, t) => n + t.members.length, 0);
    const leaderCount = teams.reduce((n, t) => n + t.members.filter((m) => m.teamRole === 'leader').length, 0);
    const subjectTeams = teams.filter((t) => t.subject).length;

    return (
        <div style={{ padding: '28px 32px 48px', direction: 'rtl', maxWidth: 900 }}>

            {/* Stats + action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div style={{
                    display: 'flex', gap: 24, padding: '14px 20px', borderRadius: 14,
                    background: C.surface, border: `1px solid ${C.border}`,
                }}>
                    <Stat label="فريق" value={teams.length} color={C.text} />
                    <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />
                    <Stat label="عضو" value={totalMembers} color={C.accentText} />
                    <Stat label="مواد" value={subjectTeams} color={C.blue} />
                    {leaderCount > 0 && <Stat label="قائد" value={leaderCount} color={C.amber} />}
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <SearchInput value={search} onChange={setSearch} placeholder="بحث في الفرق…" />
                    <button onClick={() => setShowCreate(true)} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
                        background: C.accentFaint, border: `1px solid ${C.accentBorder}`, color: C.accentText,
                    }}>
                        <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> فريق جديد
                    </button>
                </div>
            </div>

            {loading ? (
                <Empty icon="◉" text="جارٍ التحميل…" />
            ) : filtered.length === 0 ? (
                <div style={{
                    padding: '52px 0', textAlign: 'center',
                    background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 16,
                }}>
                    <div style={{ fontSize: 30, marginBottom: 12, opacity: 0.12 }}>◉</div>
                    <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 4 }}>
                        {search ? 'لا توجد فرق تطابق البحث' : 'لا توجد فرق بعد'}
                    </p>
                    {!search && <p style={{ fontSize: 12, color: C.textMuted, opacity: 0.6 }}>أنشئ أول فريق لتنظيم المساهمين</p>}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map((team) => (
                        <TeamCard key={team._id} team={team} allContributors={allContributors} onUpdate={handleUpdate} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            {showCreate && (
                <CreateTeamModal
                    onClose={() => setShowCreate(false)}
                    onCreated={(team) => { setTeams((prev) => [team, ...prev]); setShowCreate(false); }}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLES SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

function RoleCard({ role, onEdit, onToggle, onDelete, toggling, deleting }) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [hover, setHover] = useState(false);
    const meta = CAT_META[role.category] || CAT_META.learning;
    const qCount = role.interviewQuestions?.length ?? 0;

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                borderRadius: 14, overflow: 'hidden', transition: 'all 0.15s',
                background: C.surface, border: `1px solid ${hover ? C.borderMid : C.border}`,
                opacity: role.isActive ? 1 : 0.5,
            }}
        >
            <div style={{ padding: '14px 16px' }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                        background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color,
                    }}>{meta.icon}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{role.name}</span>
                            {!role.isActive && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted }}>معطّل</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}>{meta.icon} {meta.label}</span>
                            {role.subcategory && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted }}>{role.subcategory}</span>}
                            {role.portfolioPrompt && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted }}>◆ محفظة</span>}
                        </div>
                        {role.description && <p style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5, margin: 0 }}>{role.description}</p>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, width: 76 }}>
                        <button onClick={() => onEdit(role)} style={{
                            padding: '6px 0', borderRadius: 9, fontSize: 11, cursor: 'pointer', textAlign: 'center',
                            background: C.surfaceMid, border: `1px solid ${C.border}`, color: C.textSub,
                        }}>تعديل</button>
                        <button onClick={() => onToggle(role)} disabled={toggling} style={{
                            padding: '6px 0', borderRadius: 9, fontSize: 11, cursor: 'pointer', textAlign: 'center',
                            opacity: toggling ? 0.5 : 1,
                            background: role.isActive ? C.redBg : C.accentFaint,
                            border: `1px solid ${role.isActive ? C.redBorder : C.accentBorder}`,
                            color: role.isActive ? C.red : C.accentText,
                        }}>{toggling ? '···' : role.isActive ? 'تعطيل' : 'تفعيل'}</button>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 11, color: C.textMuted }}>
                            <span style={{ fontVariantNumeric: 'tabular-nums', color: C.textSub }}>{qCount}</span> {qCount === 1 ? 'سؤال' : 'أسئلة'}
                        </span>
                        {role.microTask?.prompt && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted }}>مهمة ✓</span>}
                    </div>

                    {confirmDelete ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: C.red }}>تأكيد الحذف؟</span>
                            <button onClick={() => onDelete(role)} style={{
                                fontSize: 10, padding: '2px 8px', borderRadius: 7, cursor: 'pointer',
                                background: C.redBg, border: `1px solid ${C.redBorder}`, color: C.red,
                            }}>{deleting ? '···' : 'حذف'}</button>
                            <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted }}>إلغاء</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            style={{
                                fontSize: 10, background: 'none', border: 'none', cursor: 'pointer',
                                color: C.textMuted, opacity: hover ? 1 : 0, transition: 'opacity 0.15s',
                            }}
                        >حذف</button>
                    )}
                </div>
            </div>
        </div>
    );
}

function RolesScreen() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [acting, setActing] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/roles');
        const data = await res.json();
        setRoles(data.roles || []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleToggle = async (role) => {
        const key = role._id + 'toggle';
        setActing(key);
        await fetch(`/api/admin/roles/${role._id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !role.isActive }),
        });
        setActing(null); load();
    };

    const handleDelete = async (role) => {
        const key = role._id + 'delete';
        setActing(key);
        const res = await fetch(`/api/admin/roles/${role._id}`, { method: 'DELETE' });
        const data = await res.json();
        setActing(null);
        if (!data.ok) { alert(data.error || 'لا يمكن الحذف'); return; }
        load();
    };

    const grouped = {};
    CAT_ORDER.forEach((cat) => {
        const catRoles = roles.filter((r) => r.category === cat);
        if (catRoles.length) grouped[cat] = catRoles;
    });

    const activeCount = roles.filter((r) => r.isActive).length;
    const inactiveCount = roles.filter((r) => !r.isActive).length;
    const totalQs = roles.reduce((n, r) => n + (r.interviewQuestions?.length ?? 0), 0);

    return (
        <div style={{ padding: '28px 32px 48px', direction: 'rtl', maxWidth: 900 }}>

            {/* Stats + action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div style={{
                    display: 'flex', gap: 24, padding: '14px 20px', borderRadius: 14,
                    background: C.surface, border: `1px solid ${C.border}`,
                }}>
                    <Stat label="مفعّل" value={activeCount} color={C.green} />
                    {inactiveCount > 0 && <><div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} /><Stat label="معطّل" value={inactiveCount} color={C.textMuted} /></>}
                    {totalQs > 0 && <><div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} /><Stat label="سؤال إجمالاً" value={totalQs} color={C.textSub} /></>}
                </div>
                <button onClick={() => setModal('create')} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
                    background: C.accentFaint, border: `1px solid ${C.accentBorder}`, color: C.accentText,
                }}>
                    <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> دور جديد
                </button>
            </div>

            {loading && <Empty text="جارٍ التحميل…" />}
            {!loading && roles.length === 0 && <Empty icon="◈" text="لا توجد أدوار بعد" sub="أنشئ أول دور لتبدأ في قبول المساهمين بطريقة منظّمة" />}

            {!loading && Object.entries(grouped).map(([cat, catRoles]) => {
                const meta = CAT_META[cat] || CAT_META.learning;
                return (
                    <div key={cat} style={{ marginBottom: 28 }}>
                        {/* Category header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <span style={{
                                fontSize: 11, padding: '3px 10px', borderRadius: 8,
                                background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color,
                            }}>{meta.icon} {meta.label}</span>
                            <span style={{ fontSize: 11, color: C.textMuted, fontVariantNumeric: 'tabular-nums' }}>{catRoles.length}</span>
                            <div style={{ flex: 1, height: 1, background: C.border }} />
                        </div>

                        {/* Role cards grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {catRoles.map((role) => (
                                <RoleCard
                                    key={role._id} role={role}
                                    onEdit={setModal} onToggle={handleToggle} onDelete={handleDelete}
                                    toggling={acting === role._id + 'toggle'} deleting={acting === role._id + 'delete'}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}

            {modal && (
                <RoleModal
                    role={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={() => { setModal(null); load(); }}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT — PeopleSection
// ═══════════════════════════════════════════════════════════════════════════════

export function PeopleSection({ allContributors, isLoading, onRefresh, onOptimisticUpdate, onOptimisticRemove }) {
    const [screen, setScreen] = useState('contributors');

    const pendingCount = allContributors.filter((c) => c.status === 'pending').length;
    const badges = { pending: pendingCount };

    return (
        <div style={{ minHeight: '100vh', direction: 'rtl' }}>
            <TopNav active={screen} onChange={setScreen} badges={badges} />

            {screen === 'contributors' && (
                <ContributorsScreen allContributors={allContributors} onRefresh={onRefresh} />
            )}
            {screen === 'teams' && (
                <TeamsScreen allContributors={allContributors} />
            )}
            {screen === 'roles' && (
                <RolesScreen />
            )}
        </div>
    );
}