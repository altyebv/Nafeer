'use client';
import { useState, useEffect, useCallback } from 'react';
import { RoleModal }    from './modals/RoleModal';
import { Btn }          from './ui/Btn';
import { EmptyState }   from './ui/EmptyState';
import { SectionHeader } from './ui/SectionHeader';

const CATEGORY_META = {
  content:     { label: 'محتوى تعليمي', icon: '◈', color: 'text-amber-400  bg-amber-900/20  border-amber-800/40'  },
  development: { label: 'تطوير',         icon: '⬡', color: 'text-blue-400   bg-blue-900/20   border-blue-800/40'   },
  design:      { label: 'تصميم',         icon: '◇', color: 'text-purple-400 bg-purple-900/20 border-purple-800/40' },
};

function RoleCard({ role, onEdit, onToggle, onDelete, toggling, deleting }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const meta = CATEGORY_META[role.category] || CATEGORY_META.content;

  return (
    <div
      className={`rounded-xl border transition-all ${
        role.isActive
          ? 'bg-ink-900/60 border-ink-800/50 hover:border-ink-700/50'
          : 'bg-ink-950/40 border-ink-900/40 opacity-60'
      }`}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Category icon */}
          <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base border ${meta.color}`}>
            {meta.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="font-bold text-sand-200 font-arabic text-sm">{role.name}</h3>
              {!role.isActive && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-ink-700/40 bg-ink-800/40 text-ink-600 font-arabic">
                  معطّل
                </span>
              )}
            </div>

            {/* Category + subcategory */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-arabic ${meta.color}`}>
                {meta.label}
              </span>
              {role.subcategory && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-ink-700/40 text-ink-500 font-arabic">
                  {role.subcategory}
                </span>
              )}
            </div>

            {role.description && (
              <p className="text-[11px] text-ink-600 font-arabic leading-relaxed line-clamp-2">
                {role.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="shrink-0 flex flex-col gap-1.5 min-w-[100px]">
            <Btn small variant="ghost" onClick={() => onEdit(role)}>تعديل</Btn>
            <Btn
              small
              variant={role.isActive ? 'red' : 'sand'}
              loading={toggling}
              onClick={() => onToggle(role)}
            >
              {role.isActive ? 'تعطيل' : 'تفعيل'}
            </Btn>
          </div>
        </div>

        {/* Questions summary */}
        <div className="mt-3 pt-3 border-t border-ink-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] font-arabic text-ink-600">
            <span>
              <span className="text-ink-400 font-mono">{role.interviewQuestions?.length ?? 0}</span>
              {' '}سؤال
            </span>
            {role.microTask?.prompt && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-ink-800/60 text-ink-700">
                مهمة تطبيقية ✓
              </span>
            )}
          </div>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-red-400 font-arabic">حذف نهائي؟</span>
              <button
                onClick={() => onDelete(role)}
                className="text-[10px] font-arabic px-2 py-0.5 rounded bg-red-900/40 border border-red-800/40 text-red-400 hover:bg-red-900/60 transition-colors"
              >
                {deleting ? '···' : 'تأكيد'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] font-arabic text-ink-700 hover:text-ink-400 transition-colors"
              >
                إلغاء
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[10px] font-mono text-ink-800 hover:text-red-500 transition-colors"
            >
              حذف
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function RolesSection() {
  const [roles,   setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | 'create' | role object (edit)
  const [acting,  setActing]  = useState(null); // roleId + action key

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
    if (!data.ok) {
      alert(data.error || 'لا يمكن الحذف');
      return;
    }
    load();
  };

  const handleSaved = (savedRole) => {
    setModal(null);
    load();
  };

  // Group by category
  const grouped = roles.reduce((acc, r) => {
    const cat = r.category || 'content';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  const activeCount   = roles.filter((r) => r.isActive).length;
  const inactiveCount = roles.filter((r) => !r.isActive).length;

  return (
    <div>
      <SectionHeader title="الأدوار" description="إدارة أدوار المساهمين وإعداد أسئلة المقابلة والمهام">
        <div className="flex items-center gap-4 mt-3">
          <span className="text-xs font-arabic text-ink-500">
            <span className="text-sand-400 font-mono">{activeCount}</span> مفعّل
            {inactiveCount > 0 && (
              <> · <span className="text-ink-600 font-mono">{inactiveCount}</span> معطّل</>
            )}
          </span>
        </div>
      </SectionHeader>

      <div className="px-8 pb-8">

        {/* Create button */}
        <div className="flex justify-start mb-6">
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-arabic bg-sand-900/30 hover:bg-sand-900/50 border border-sand-800/50 text-sand-400 hover:text-sand-300 transition-all"
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
          const meta = CATEGORY_META[cat] || CATEGORY_META.content;
          return (
            <div key={cat} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-sm ${meta.color} border px-2.5 py-1 rounded-lg font-arabic`}>
                  {meta.icon} {meta.label}
                </span>
                <span className="text-[11px] font-mono text-ink-700">{catRoles.length}</span>
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

      {/* Modal */}
      {modal && (
        <RoleModal
          role={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
