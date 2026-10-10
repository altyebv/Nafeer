'use client';
import { useState } from 'react';
import { DEMO_PROFILE, SUBJECTS_BY_PATH, SUBJECT_COLORS } from '../demoData';
import { BADGE_ART } from '../badgeArt';
import { getLevel } from './HomeScreen';

const FONT = 'var(--font-arabic)';
const toAr = n => n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const lerp = (a, b, t) => a + (b - a) * t;
const word = n => (n === 0 ? 'صفر' : toAr(n));
const caption = { font: `600 12px/18px ${FONT}`, color: 'var(--b-ink2)' };

function plural(n, one, two, few, many) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${toAr(n)} ${few}`;
  return `${toAr(n)} ${many}`;
}
function hoursAndMinutes(total) {
  const h = Math.floor(total / 60), m = total % 60;
  if (h === 0) return plural(m, 'دقيقة واحدة', 'دقيقتين', 'دقائق', 'دقيقة');
  const hs = plural(h, 'ساعة', 'ساعتين', 'ساعات', 'ساعة');
  return m === 0 ? hs : `${hs} و${plural(m, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة')}`;
}

const BADGES = [
  { art: 'badge_firstlesson', name: 'أول خطوة', remark: 'هذه هي البداية الحقيقية.' },
  { art: 'badge_comeback', name: 'عودة قوية', remark: 'العودة هي الانتصار الحقيقي.' },
  { art: 'badge_pace', name: 'استجاب في الوقت', remark: 'هذا هو الانضباط الحقيقي.' },
  { art: 'badge_bounce', name: 'ارتد من جديد', remark: 'هذا هو المثابر الحقيقي.' },
  { art: 'badge_honest', name: 'الطالب الصادق', remark: 'مواجهة الصعب هي البداية الحقيقية للفهم.' },
  { art: 'badge_focus', name: 'تركيز عميق' },
  { art: 'badge_explorer', name: 'الفضولي' },
  { art: 'badge_steady', name: 'خطوة خطوة' },
  { art: 'badge_fullday', name: 'يوم كامل' },
  { art: 'badge_firstgoal', name: 'الخطوة الأولى' },
  { art: 'badge_exampush', name: 'الضغط الحقيقي' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ProfileScreen — the student's notebook: an amber header that folds away, the
// record (streak, level, totals), the week, the subjects as tiles that open
// their own record, and the stamps earned.
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileScreen({ userProfile, bonusXp = 0 }) {
  const [subject, setSubject] = useState(null);
  const [sheet, setSheet] = useState(null);       // a badge, or 'notice'

  if (subject) return <SubjectRecord subject={subject} onBack={() => setSubject(null)} />;
  return <ProfilePage userProfile={userProfile} bonusXp={bonusXp} onSubject={setSubject} sheet={sheet} setSheet={setSheet} />;
}

function ProfilePage({ userProfile, bonusXp, onSubject, sheet, setSheet }) {
  const [f, setF] = useState(0);
  const P = DEMO_PROFILE;
  const name = userProfile?.name || P.nameAr;
  const path = userProfile?.path || 'SCIENCE';
  const pathLabel = path === 'SCIENCE' ? 'العلمي' : 'الأدبي';
  const subjects = SUBJECTS_BY_PATH[path] || SUBJECTS_BY_PATH.SCIENCE;
  const xp = 960 + bonusXp;
  const lvl = getLevel(xp);
  const ink = 'var(--b-on-band)';
  const captionAlpha = Math.max(0, 1 - f / 0.5);
  const compactAlpha = Math.max(0, (f - 0.5) / 0.5);

  return (
    <div dir="rtl" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--b-band)', color: 'var(--b-ink)' }}>
      {/* header band */}
      <header style={{ flexShrink: 0, padding: '0 20px', color: ink }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ flex: 1, position: 'relative', height: 36, display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', font: `700 12px/18px ${FONT}`, opacity: captionAlpha }}>كرّاسك</span>
            <span style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 12, opacity: compactAlpha }}>
              <Avatar name={name} size={36} frame={ink} />
              <span style={{ font: `800 16px/24px ${FONT}` }}>{name}</span>
            </span>
          </div>
          <IconBtn label="الإعدادات" onClick={() => setSheet('notice')} color={ink}>
            <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
          </IconBtn>
          <IconBtn label="مركز التواصل" onClick={() => setSheet('notice')} color={ink}>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </IconBtn>
        </div>
        {/* the name label off a notebook's cover */}
        <div style={{ overflow: 'hidden', maxHeight: lerp(200, 0, f), opacity: Math.max(0, 1 - f / 0.6) }}>
          <NameLabel name={name} path={pathLabel} school={P.school} bio={P.bio} onClick={() => setSheet('notice')} />
          <div style={{ height: 16 }} />
        </div>
      </header>

      <div onScroll={e => setF(Math.min(1, e.currentTarget.scrollTop / 120))}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', background: 'var(--b-paper)', borderRadius: '16px 16px 0 0' }}>

        {/* the record */}
        <section style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', paddingBottom: 14 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--b-accent-text)" stroke="var(--b-accent-text)" strokeWidth="1.8" strokeLinejoin="round">
                <path d="M12 2c.5 3-1.5 4.5-3 6.5C7.5 10.5 7 12 7 13.5a5 5 0 0 0 10 0c0-1.5-.5-2.5-1-3.5-.5 1-1.5 1.5-2 1.5.5-3-.5-6-2-9.5z" />
              </svg>
              <div>
                <div style={{ font: `800 14px/22px ${FONT}` }}>{toAr(P.currentStreak)} أيام متتالية</div>
                <div style={caption}>أطول سلسلة ليك {toAr(P.longestStreak)} يوماً</div>
              </div>
            </div>
            <span style={{ width: 1, background: 'var(--b-rule-strong)' }} />
            <div style={{ flex: 1, paddingRight: 16 }}>
              <div style={{ font: `800 14px/22px ${FONT}` }}>المستوى {toAr(lvl.level)}</div>
              <Bar fraction={lvl.progress / 100} />
              <div style={caption}>باقي {toAr(lvl.next.minXp - xp)} نقطة للتالي</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--b-rule)', display: 'flex', padding: '12px 0 10px' }}>
            <Figure n={word(P.totals.lessons)} label="درس" />
            <Figure n={word(P.totals.cards)} label="بطاقة" />
            <Figure n={word(P.totals.questions)} label="سؤال" />
            <Figure n={toAr(Math.floor(P.totals.minutes / 60))} label="ساعة مذاكرة" />
          </div>
          <div style={{ borderTop: '2px solid var(--b-ink)' }} />
        </section>

        <ActivityChart />

        {/* subjects as notebook tiles */}
        <section style={{ padding: '22px 20px 0' }}>
          <SectionHeader title="تقدّمك في المواد" trailing={`${toAr(subjects.length)} مواد`} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {subjects.map(s => <SubjectTile key={s.id} s={s} onClick={() => onSubject(s)} />)}
          </div>
        </section>

        {/* stamps */}
        <section style={{ padding: '24px 20px 28px' }}>
          <SectionHeader title="أختامك" trailing={`${toAr(P.earnedBadges.length)} من ${toAr(BADGES.length)}`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {BADGES.map(b => {
              const got = P.earnedBadges.includes(b.art);
              return (
                <button key={b.art} onClick={() => got && setSheet(b)} aria-label={got ? `ختم ${b.name}` : `ختم ${b.name}، لسه ما أخدته`}
                  style={{ background: 'none', border: 0, padding: 0, cursor: got ? 'pointer' : 'default', textAlign: 'center', color: 'var(--b-ink)' }}>
                  <BadgeArt id={b.art} size={72} locked={!got} />
                  <div style={{ font: `700 12px/18px ${FONT}`, color: got ? 'var(--b-ink)' : 'var(--b-ink3)' }}>{b.name}</div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {sheet && <Sheet sheet={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}

// ── pieces ───────────────────────────────────────────────────────────────────

function IconBtn({ label, onClick, color, children }) {
  return (
    <button onClick={onClick} aria-label={label} style={{ width: 44, height: 44, background: 'none', border: 0, cursor: 'pointer', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    </button>
  );
}

function Avatar({ name, size, frame }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: 10, background: 'var(--b-sunken)', border: `${size < 48 ? 1.5 : 1}px solid ${frame}`, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center', font: `800 ${size < 48 ? 16 : 26}px/1 ${FONT}`, color: 'var(--b-ink)', flexShrink: 0,
    }}>{name.trim().slice(0, 1) || 'ب'}</span>
  );
}

/** The sticker on a school notebook's cover: a double frame, and dotted lines to write on. */
function NameLabel({ name, path, school, bio, onClick }) {
  const line = (cap, val, style) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 2, borderBottom: '1px dotted var(--b-ink3)' }}>
      <span style={{ ...caption, paddingBottom: 2 }}>{cap}</span>
      <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...style }}>{val}</span>
    </div>
  );
  return (
    <button onClick={onClick} aria-label="عدّل بياناتك" style={{
      display: 'block', width: '100%', textAlign: 'right', cursor: 'pointer', color: 'var(--b-ink)', padding: 6,
      background: 'var(--b-surface)', border: '1.5px solid var(--b-ink)', borderRadius: 10, boxSizing: 'border-box',
    }}>
      <div style={{ border: '1px solid var(--b-ink)', borderRadius: 6, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={name} size={64} frame="var(--b-rule-strong)" />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {line('الاسم', name, { font: `800 16px/24px ${FONT}` })}
            {line('المسار', path, { font: `600 14px/22px ${FONT}` })}
            {line('المدرسة', school, { font: `600 14px/22px ${FONT}` })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px dotted var(--b-ink3)', paddingBottom: 2 }}>
          <span style={caption}>نبذة</span>
          <span className="b-read" style={{ flex: 1, font: '400 15px/26px var(--font-read)' }}>{bio}</span>
        </div>
      </div>
    </button>
  );
}

function Bar({ fraction }) {
  return (
    <div style={{ height: 6, borderRadius: 4, background: 'var(--b-sunken)', margin: '4px 0', overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(1, fraction)) * 100}%`, height: '100%', background: 'var(--b-accent)', borderRadius: 4 }} />
    </div>
  );
}

function Figure({ n, label }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ font: `800 18px/26px ${FONT}` }}>{n}</div>
      <div style={caption}>{label}</div>
    </div>
  );
}

function SectionHeader({ title, trailing }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 10 }}>
      <h3 style={{ margin: 0, font: `800 16px/24px ${FONT}` }}>{title}</h3>
      <span style={caption}>{trailing}</span>
    </div>
  );
}

// ── the week ─────────────────────────────────────────────────────────────────

function ActivityChart() {
  const P = DEMO_PROFILE;
  const [points, setPoints] = useState(false);
  const key = points ? 'points' : 'minutes';
  const max = Math.max(...P.week.map(d => d[key]), 1);
  const active = P.week.filter(d => d.minutes > 0).length;
  const total = P.week.reduce((a, d) => a + d.minutes, 0);
  const H = 96;
  const goalLine = points ? null : Math.min(1, P.goalMinutes / max);

  return (
    <section style={{ padding: '22px 20px 0' }}>
      <SectionHeader title="نشاطك في آخر ٧ أيام" trailing={`${toAr(active)} من ٧ أيام`} />
      <div role="group" style={{ display: 'flex', gap: 6, paddingBottom: 12, alignItems: 'center' }}>
        {[['وقت', false], ['نقاط', true]].map(([t, v]) => (
          <button key={t} onClick={() => setPoints(v)} aria-pressed={points === v} style={{
            minHeight: 32, padding: '0 14px', borderRadius: 4, cursor: 'pointer', font: `700 12px/18px ${FONT}`,
            background: points === v ? 'var(--b-ink)' : 'transparent', color: points === v ? 'var(--b-paper)' : 'var(--b-ink)',
            border: '1px solid var(--b-ink)',
          }}>{t}</button>
        ))}
        <span style={{ flex: 1, ...caption, textAlign: 'left' }}>{hoursAndMinutes(total)}</span>
      </div>
      <div style={{ position: 'relative', height: H + 22 }}>
        {goalLine !== null && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 22 + goalLine * H, borderTop: '1.5px dotted var(--b-ink3)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          {P.week.map((d, i) => {
            const h = d[key] === 0 ? 3 : Math.max(8, (d[key] / max) * H);
            const today = i === P.week.length - 1;
            const full = d.minutes >= P.goalMinutes;
            // a light day gets a lighter amber fill, never an outline
            const fill = d[key] === 0 ? 'var(--b-rule)' : full || points ? 'var(--b-accent)' : 'var(--b-light-day)';
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: h, background: fill, borderRadius: '4px 4px 0 0' }} />
                <span style={{ font: `${today ? 800 : 600} 12px/18px ${FONT}`, color: today ? 'var(--b-ink)' : 'var(--b-ink2)' }}>{d.letter}</span>
              </div>
            );
          })}
        </div>
      </div>
      {!points && <div style={{ ...caption, paddingTop: 6 }}>الخط المنقّط هدفك، {plural(P.goalMinutes, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة')} في اليوم</div>}
    </section>
  );
}

// ── subjects ─────────────────────────────────────────────────────────────────

function SubjectTile({ s, onClick }) {
  const color = SUBJECT_COLORS[s.key] || '#4A90D9';
  return (
    <button onClick={onClick} aria-label={`افتح حصيلة ${s.nameAr}`} style={{
      position: 'relative', minHeight: 60, padding: '8px 18px 8px 10px', textAlign: 'right', cursor: 'pointer', color: 'var(--b-ink)',
      background: 'var(--b-surface)', border: '1px solid var(--b-rule-strong)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center',
    }}>
      <span style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 6, background: color, borderRadius: '0 10px 10px 0' }} />
      <span style={{ font: `700 14px/22px ${FONT}` }}>{s.nameAr}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, height: 6, borderRadius: 4, background: 'var(--b-sunken)', overflow: 'hidden' }}>
          <span style={{ display: 'block', height: '100%', width: `${s.progress}%`, background: 'var(--b-accent)', borderRadius: 4 }} />
        </span>
        <span style={caption}>{toAr(s.progress)}٪</span>
      </span>
    </button>
  );
}

function SubjectRecord({ subject, onBack }) {
  const rec = DEMO_PROFILE.subjectRecord[subject.key] || DEMO_PROFILE.subjectRecord.physics;
  const color = SUBJECT_COLORS[subject.key] || '#4A90D9';
  const acc = Math.round((rec.right / rec.answered) * 100);
  const concepts = rec.firm + rec.shaky + rec.fresh;
  const parts = [
    { n: rec.firm, c: 'var(--b-positive)', label: 'ثابت' },
    { n: rec.shaky, c: 'var(--b-warning)', label: 'محتاج تثبيت' },
    { n: rec.fresh, c: 'var(--b-rule-strong)', label: 'جديد عليك' },
  ];

  return (
    <div dir="rtl" style={{ position: 'absolute', inset: 0, overflowY: 'auto', scrollbarWidth: 'none', background: 'var(--b-paper)', color: 'var(--b-ink)' }}>
      <header style={{ position: 'relative', paddingRight: 10, background: `color-mix(in srgb, ${color} 16%, var(--b-paper))`, borderBottom: '1px solid var(--b-rule-strong)' }}>
        <span style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 10, background: color }} />
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 6px 0 20px', gap: 4 }}>
          <button onClick={onBack} aria-label="رجوع" style={{ background: 'none', border: 0, color: 'var(--b-ink)', cursor: 'pointer', padding: 10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>
          <h1 style={{ margin: 0, flex: 1, font: `800 19px/28px ${FONT}` }}>حصيلة {subject.nameAr}</h1>
        </div>
        <div style={{ padding: '0 20px 14px', ...caption, color: 'var(--b-ink)' }}>كل اللي عملته في المادة دي</div>
      </header>

      <section style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', borderTop: '2px solid var(--b-ink)', borderBottom: '1px solid var(--b-rule)' }}>
          <Figure n={`${toAr(subject.progress)}٪`} label="الدروس" />
          <span style={{ width: 1, background: 'var(--b-rule)' }} />
          <Figure n={`${toAr(acc)}٪`} label="إجابات صحيحة" />
          <span style={{ width: 1, background: 'var(--b-rule)' }} />
          <Figure n={toAr(rec.answered)} label="سؤال" />
        </div>
        <p style={{ margin: '12px 0 0', font: `500 14px/24px ${FONT}`, color: 'var(--b-ink2)' }}>
          جاوبت {toAr(rec.right)} من {toAr(rec.answered)} صاح، وذاكرت {hoursAndMinutes(rec.minutes)}.
        </p>
      </section>

      <section style={{ padding: '22px 20px 28px' }}>
        <SectionHeader title="مفاهيم المادة" trailing={plural(concepts, 'مفهوم واحد', 'مفهومين', 'مفاهيم', 'مفهوماً')} />
        <div style={{ display: 'flex', height: 10, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
          {parts.map((p, i) => p.n > 0 && <span key={i} style={{ flex: p.n, background: p.c }} />)}
        </div>
        {parts.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48, borderBottom: '1px solid var(--b-rule)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: p.c }} />
            <span style={{ flex: 1, font: `700 14px/22px ${FONT}` }}>{p.label}</span>
            <span style={{ font: `800 14px/22px ${FONT}` }}>{word(p.n)}</span>
          </div>
        ))}
        <p style={{ margin: '12px 0 0', font: `500 12px/20px ${FONT}`, color: 'var(--b-ink2)' }}>كل مفهوم بيرجع ليك في المراجعة في يومه.</p>
      </section>
    </div>
  );
}

// ── stamps ───────────────────────────────────────────────────────────────────

function BadgeArt({ id, size, locked }) {
  const art = BADGE_ART[id] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden style={{ opacity: locked ? 0.28 : 1, filter: locked ? 'grayscale(1)' : 'none' }}>
      {art.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill || 'none'} fillOpacity={p.fillOpacity} stroke={p.stroke} strokeWidth={p.sw}
          strokeLinecap={p.cap} strokeLinejoin={p.join} />
      ))}
    </svg>
  );
}

function Sheet({ sheet, onClose }) {
  const badge = sheet !== 'notice' ? sheet : null;
  return (
    <div role="dialog" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', zIndex: 30 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--b-surface)', borderRadius: '16px 16px 0 0', padding: '20px 20px 24px', textAlign: 'center' }}>
        {badge ? (
          <>
            <BadgeArt id={badge.art} size={96} />
            <h3 style={{ margin: '4px 0 0', font: `800 16px/24px ${FONT}` }}>{badge.name}</h3>
            {badge.remark && <p style={{ margin: '4px 0 0', font: '700 22px/32px var(--font-remark)', color: 'var(--b-red-ink)', transform: 'rotate(-1deg)' }}>{badge.remark}</p>}
          </>
        ) : (
          <>
            <h3 style={{ margin: 0, font: `800 16px/24px ${FONT}` }}>دي في التطبيق</h3>
            <p style={{ margin: '4px 0 0', font: `500 14px/24px ${FONT}`, color: 'var(--b-ink2)' }}>
              الإعدادات وتعديل البيانات ومركز الرسائل بتلقاها في التطبيق الكامل.
            </p>
          </>
        )}
        <div style={{ paddingTop: 16 }}><button className="b-btn" onClick={onClose}>تمام</button></div>
      </div>
    </div>
  );
}
