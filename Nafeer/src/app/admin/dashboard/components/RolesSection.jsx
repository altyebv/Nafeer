'use client';
import { useState, useEffect, useCallback } from 'react';
import { RoleModal }     from './modals/RoleModal';
import { EmptyState }    from './ui/EmptyState';
import { SectionHeader } from './ui/SectionHeader';

// Matches expanded model enum — legacy values included for backward compat
const CATEGORY_META = {
  learning:    { label: 'تجربة تعليمية', icon: '◈', color: 'text-amber-400  bg-amber-900/20  border-amber-800/40'  },
  core:        { label: 'بناء المنصة',   icon: '⬡', color: 'text-blue-400   bg-blue-900/20   border-blue-800/40'   },
  growth:      { label: 'نشر الفكرة',    icon: '◉', color: 'text-purple-400 bg-purple-900/20 border-purple-800/40' },
  operations:  { label: 'تنظيم نفير',    icon: '▦', color: 'text-teal-400   bg-teal-900/20   border-teal-800/40'   },
  content:     { label: 'محتوى',         icon: '◈', color: 'text-amber-400  bg-amber-900/20  border-amber-800/40'  },
  development: { label: 'تطوير',         icon: '⬡', color: 'text-blue-400   bg-blue-900/20   border-blue-800/40'   },
  design:      { label: 'تصميم',         icon: '◇', color: 'text-purple-400 bg-purple-900/20 border-purple-800/40' },
};

const CATEGORY_ORDER = ['learning', 'core', 'growth', 'operations', 'content', 'development', 'design'];

// ─── Role card ────────────────────────────────────────────────────────────────
function RoleCard({ role, onEdit, onToggle, onDelete, toggling, deleting }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const meta = CATEGORY_META[role.category] || CATEGORY_META.learning;
  const qCount = role.interviewQuestions?.length ?? 0;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 group ${
        role.isActive
          ? 'bg-ink-900/60 border-ink-800/50 hover:border-ink-700/60'
          : 'bg-ink-950/40 border-ink-900/40 opacity-55'
      }`}
    >
      <div className="p-4">
        {/* ── Top row ── */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm border ${meta.color}`}>
            {meta.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="font-bold text-sand-200 font-arabic text-sm leading-tight">{role.name}</h3>
              {!role.isActive && (
                <span className="text-2xs px-2 py-0.5 rounded-full border border-ink-700/40 bg-ink-800/40 text-ink-600 font-arabic">
                  معطّل
                </span>
              )}
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className={`text-2xs px-2 py-0.5 rounded-full border font-arabic ${meta.color}`}>
                {meta.label}
              </span>
              {role.subcategory && (
                <span className="text-2xs px-2 py-0.5 rounded-full border border-ink-700/40 text-ink-500 font-arabic">
                  {role.subcategory}
                </span>
              )}
              {role.portfolioPrompt && (
                <span className="text-2xs px-2 py-0.5 rounded-full border border-ink-700/30 text-ink-600 font-arabic">
                  ◆ محفظة
                </span>
              )}
            </div>

            {role.description && (
              <p className="text-xs text-ink-600 font-arabic leading-relaxed line-clamp-2">
                {role.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="shrink-0 flex flex-col gap-1.5 w-[90px]">
            <button
              onClick={() => onEdit(role)}
              className="w-full py-1.5 rounded-lg text-2xs font-arabic border transition-all bg-ink-800/60 hover:bg-ink-700/60 border-ink-700/50 text-ink-300 hover:text-ink-100"
            >
              تعديل
            </button>
            <button
              onClick={() => onToggle(role)}
              disabled={toggling}
              className={`w-full py-1.5 rounded-lg text-2xs font-arabic border transition-all disabled:opacity-50 ${
                role.isActive
                  ? 'bg-red-900/20 hover:bg-red-900/40 border-red-800/30 text-red-500'
                  : 'bg-sand-900/20 hover:bg-sand-900/40 border-sand-800/30 text-sand-500'
              }`}
            >
              {toggling ? '···' : role.isActive ? 'تعطيل' : 'تفعيل'}
            </button>
          </div>
        </div>

        {/* ── Footer row ── */}
        <div className="mt-3 pt-3 border-t border-ink-800/30 flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-2xs font-arabic text-ink-700">
              <span className="font-mono text-ink-500">{qCount}</span>
              {' '}{qCount === 1 ? 'سؤال' : 'أسئلة'}
            </span>
            {role.microTask?.prompt && (
              <span className="text-2xs px-2 py-0.5 rounded-full border border-ink-800/50 text-ink-700 font-arabic">
                مهمة ✓
              </span>
            )}
            {qCount > 0 && role.interviewQuestions?.some((q) => q.subjectFilter?.length > 0) && (
              <span className="text-2xs px-2 py-0.5 rounded-full border border-ink-800/50 text-ink-700 font-arabic">
                تصفية مواد
              </span>
            )}
          </div>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-2xs text-red-400 font-arabic">تأكيد الحذف؟</span>
              <button
                onClick={() => onDelete(role)}
                className="text-2xs font-arabic px-2 py-0.5 rounded-lg bg-red-900/40 border border-red-800/40 text-red-400 hover:bg-red-900/60 transition-colors"
              >
                {deleting ? '···' : 'حذف'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-2xs font-arabic text-ink-700 hover:text-ink-400 transition-colors"
              >
                إلغاء
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-2xs font-mono text-ink-800 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              حذف
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export function RolesSection() {
  const [roles,   setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);   // null | 'create' | role object
  const [acting,  setActing]  = useState(null);   // roleId + action key

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch('/api/admin/roles');
    const data = await res.json();
    setRoles(data.roles || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (role) => {
    const key = role._id + 'toggle';
    setActing(key);
    await fetch(`/api/admin/roles/${role._id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isActive: !role.isActive }),
    });
    setActing(null);
    load();
  };

  const handleDelete = async (role) => {
    const key = role._id + 'delete';
    setActing(key);
    const res  = await fetch(`/api/admin/roles/${role._id}`, { method: 'DELETE' });
    const data = await res.json();
    setActing(null);
    if (!data.ok) { alert(data.error || 'لا يمكن الحذف'); return; }
    load();
  };

  // Group by category preserving canonical order
  const grouped = {};
  CATEGORY_ORDER.forEach((cat) => {
    const catRoles = roles.filter((r) => r.category === cat);
    if (catRoles.length) grouped[cat] = catRoles;
  });

  const activeCount   = roles.filter((r) =>  r.isActive).length;
  const inactiveCount = roles.filter((r) => !r.isActive).length;
  const totalQs       = roles.reduce((n, r) => n + (r.interviewQuestions?.length ?? 0), 0);

  return (
    <div>
      <SectionHeader title="الأدوار" description="إدارة أدوار المساهمين وإعداد أسئلة المقابلة والمهام">
        <div className="flex items-center gap-4 mt-3">
          <span className="text-xs font-arabic text-ink-500">
            <span className="text-sand-400 font-mono">{activeCount}</span> مفعّل
            {inactiveCount > 0 && (
              <> · <span className="text-ink-600 font-mono">{inactiveCount}</span> معطّل</>
            )}
            {totalQs > 0 && (
              <> · <span className="text-ink-600 font-mono">{totalQs}</span> سؤال إجمالاً</>
            )}
          </span>
        </div>
      </SectionHeader>

      <div className="px-8 pb-8">

        {/* Create button */}
        <div className="flex justify-start mb-6">
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-arabic transition-all"
            style={{
              background:  'rgba(212,137,30,0.08)',
              border:      '1px solid rgba(212,137,30,0.2)',
              color:       'rgba(212,137,30,0.85)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,137,30,0.14)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212,137,30,0.08)'; }}
          >
            <span className="text-base leading-none">+</span>
            دور جديد
          </button>
        </div>

        {loading && (
          <div className="text-center py-20">
            <p className="text-ink-700 font-arabic animate-pulse text-sm">جاري التحميل...</p>
          </div>
        )}

        {!loading && roles.length === 0 && (
          <EmptyState
            text="لا توجد أدوار بعد"
            sub="أنشئ أول دور لتبدأ في قبول المساهمين بطريقة منظّمة"
          />
        )}

        {/* Grouped role cards */}
        {!loading && Object.entries(grouped).map(([cat, catRoles]) => {
          const meta = CATEGORY_META[cat] || CATEGORY_META.learning;
          return (
            <div key={cat} className="mb-8">
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`text-xs font-arabic px-2.5 py-1 rounded-lg border ${meta.color}`}>
                  {meta.icon} {meta.label}
                </span>
                <span className="text-2xs font-mono text-ink-700">{catRoles.length}</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {catRoles.map((role) => (
                  <RoleCard
                    key={role._id}
                    role={role}
                    onEdit={setModal}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    toggling={acting === role._id + 'toggle'}
                    deleting={acting  === role._id + 'delete'}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-over panel */}
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