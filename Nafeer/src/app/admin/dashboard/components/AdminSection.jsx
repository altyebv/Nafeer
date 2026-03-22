'use client';
import { useState, useEffect, useCallback } from 'react';
import { Modal }         from './ui/Modal';
import { Btn }           from './ui/Btn';
import { EmptyState }    from './ui/EmptyState';
import { SectionHeader } from './ui/SectionHeader';

// ─── Create / Edit modal ──────────────────────────────────────────────────────

function AdminModal({ admin = null, onClose, onSaved }) {
  const isEdit = !!admin;
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [form,   setForm]   = useState({
    username:    admin?.username    || '',
    email:       admin?.email       || '',
    displayName: admin?.displayName || '',
    password:    '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!isEdit && (!form.username.trim() || !form.email.trim() || !form.password)) {
      setError('جميع الحقول مطلوبة'); return;
    }
    setSaving(true); setError('');
    try {
      const res  = await fetch('/api/admin/admins', {
        method:  isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(
          isEdit
            ? { id: admin._id, action: 'update', displayName: form.displayName, email: form.email }
            : form
        ),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'حدث خطأ'); setSaving(false); return; }
      onSaved();
    } catch {
      setError('تعذّر الاتصال بالخادم'); setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg text-sm font-mono bg-ink-800/60 border border-ink-700/50 text-ink-200 placeholder-ink-700 focus:outline-none focus:border-sand-700/60 transition-colors';

  return (
    <Modal title={isEdit ? `تعديل: ${admin.username}` : 'مشرف جديد'} onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="text-xs text-red-400 px-3 py-2 rounded-lg bg-red-950/30 border border-red-900/40">{error}</p>}

        {!isEdit && (
          <div>
            <label className="block text-xs text-ink-500 mb-1.5 font-mono">USERNAME</label>
            <input type="text" dir="ltr" value={form.username} onChange={(e) => set('username', e.target.value)}
              placeholder="admin_username" className={inputCls} />
          </div>
        )}

        <div>
          <label className="block text-xs text-ink-500 mb-1.5 font-mono">EMAIL</label>
          <input type="email" dir="ltr" value={form.email} onChange={(e) => set('email', e.target.value)}
            placeholder="admin@nafeer.io" className={inputCls} />
        </div>

        <div>
          <label className="block text-xs text-ink-500 mb-1.5 font-mono">DISPLAY NAME</label>
          <input type="text" value={form.displayName} onChange={(e) => set('displayName', e.target.value)}
            placeholder="الاسم الظاهر" className={`${inputCls} font-arabic`} />
        </div>

        {!isEdit && (
          <div>
            <label className="block text-xs text-ink-500 mb-1.5 font-mono">PASSWORD</label>
            <input type="password" dir="ltr" value={form.password} onChange={(e) => set('password', e.target.value)}
              placeholder="8+ characters" className={inputCls} />
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-5 pt-4 border-t border-ink-800/60">
        <Btn variant="ghost" onClick={onClose}>إلغاء</Btn>
        <Btn variant="sand" loading={saving} onClick={save}>{isEdit ? 'حفظ' : 'إنشاء'}</Btn>
      </div>
    </Modal>
  );
}

// ─── Reset password modal ─────────────────────────────────────────────────────

function ResetPasswordModal({ admin, onClose, onSaved }) {
  const [pw,     setPw]     = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const save = async () => {
    if (pw.length < 8) { setError('8 أحرف على الأقل'); return; }
    setSaving(true); setError('');
    const res  = await fetch('/api/admin/admins', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: admin._id, action: 'set_password', password: pw }),
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error || 'حدث خطأ'); setSaving(false); return; }
    onSaved();
  };

  return (
    <Modal title={`تغيير كلمة مرور: ${admin.username}`} onClose={onClose}>
      {error && <p className="text-xs text-red-400 mb-3 px-3 py-2 rounded-lg bg-red-950/30 border border-red-900/40">{error}</p>}
      <input type="password" dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)}
        placeholder="كلمة المرور الجديدة"
        className="w-full px-3 py-2 rounded-lg text-sm font-mono bg-ink-800/60 border border-ink-700/50 text-ink-200 placeholder-ink-700 focus:outline-none focus:border-sand-700/60 transition-colors mb-4" />
      <div className="flex gap-2">
        <Btn variant="ghost" onClick={onClose}>إلغاء</Btn>
        <Btn variant="sand" loading={saving} onClick={save}>تغيير</Btn>
      </div>
    </Modal>
  );
}

// ─── Admin row card ───────────────────────────────────────────────────────────

function AdminCard({ admin, onEdit, onResetPw, onToggle, onDelete, acting }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`rounded-xl border p-4 flex items-center gap-4 transition-all ${
      admin.isActive
        ? 'bg-ink-900/60 border-ink-800/50'
        : 'bg-ink-950/40 border-ink-900/40 opacity-60'
    }`}>
      {/* Avatar */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-sand-900/60 border border-sand-800/50 flex items-center justify-center text-sand-400 font-mono font-bold text-sm">
        {(admin.displayName || admin.username || '?')[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sand-200 text-sm font-arabic">
            {admin.displayName || admin.username}
          </span>
          {!admin.isActive && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-ink-700/40 bg-ink-800/40 text-ink-600 font-arabic">
              معطّل
            </span>
          )}
        </div>
        <p className="text-xs font-mono text-ink-600" dir="ltr">@{admin.username}</p>
        <p className="text-xs font-mono text-ink-700" dir="ltr">{admin.email}</p>
        {admin.lastSignedInAt && (
          <p className="text-[10px] font-mono text-ink-800 mt-0.5">
            آخر دخول: {new Date(admin.lastSignedInAt).toLocaleDateString('en-GB')}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex flex-col gap-1.5 min-w-[110px]">
        <Btn small variant="ghost" onClick={() => onEdit(admin)}>تعديل</Btn>
        <Btn small variant="ghost" onClick={() => onResetPw(admin)}>كلمة المرور</Btn>
        <Btn small variant={admin.isActive ? 'red' : 'sand'} loading={acting === admin._id + 'toggle'}
          onClick={() => onToggle(admin)}>
          {admin.isActive ? 'تعطيل' : 'تفعيل'}
        </Btn>

        {confirmDelete ? (
          <div className="flex flex-col gap-1 pt-1 border-t border-ink-800">
            <p className="text-[10px] text-red-400 font-arabic text-center">تأكيد؟</p>
            <Btn small variant="red" loading={acting === admin._id + 'delete'} onClick={() => onDelete(admin)}>
              حذف
            </Btn>
            <Btn small variant="ghost" onClick={() => setConfirmDelete(false)}>إلغاء</Btn>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="text-[10px] font-mono text-ink-800 hover:text-red-500 transition-colors text-center py-1">
            حذف
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function AdminsSection() {
  const [admins,  setAdmins]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | 'create' | { type, admin }
  const [acting,  setActing]  = useState(null);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch('/api/admin/admins');
    const data = await res.json();
    setAdmins(data.admins || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (admin) => {
    const key = admin._id + 'toggle';
    setActing(key);
    await fetch('/api/admin/admins', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: admin._id, action: 'toggle_active' }),
    });
    setActing(null); load();
  };

  const handleDelete = async (admin) => {
    const key = admin._id + 'delete';
    setActing(key); setError('');
    const res  = await fetch('/api/admin/admins', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: admin._id }),
    });
    const data = await res.json();
    setActing(null);
    if (!data.ok) { setError(data.error || 'لا يمكن الحذف'); return; }
    load();
  };

  const activeCount = admins.filter((a) => a.isActive).length;

  return (
    <div>
      <SectionHeader title="المشرفون" description="إدارة حسابات الوصول للوحة التحكم">
        <div className="mt-2">
          <span className="text-xs font-arabic text-ink-500">
            <span className="text-sand-400 font-mono">{activeCount}</span> نشط
            {admins.length - activeCount > 0 && (
              <> · <span className="text-ink-600 font-mono">{admins.length - activeCount}</span> معطّل</>
            )}
          </span>
        </div>
      </SectionHeader>

      <div className="px-8 pb-8">
        <div className="flex justify-start mb-6">
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-arabic bg-sand-900/30 hover:bg-sand-900/50 border border-sand-800/50 text-sand-400 hover:text-sand-300 transition-all"
          >
            <span className="text-base leading-none">+</span>
            مشرف جديد
          </button>
        </div>

        {error && (
          <p className="mb-4 text-xs text-red-400 px-3 py-2 rounded-lg bg-red-950/30 border border-red-900/40 font-arabic">
            {error}
          </p>
        )}

        {loading && (
          <div className="text-center py-20">
            <p className="text-ink-700 font-arabic animate-pulse text-sm">جاري التحميل...</p>
          </div>
        )}

        {!loading && admins.length === 0 && (
          <EmptyState text="لا يوجد مشرفون" sub="أنشئ أول حساب مشرف" />
        )}

        <div className="space-y-3">
          {admins.map((admin) => (
            <AdminCard
              key={admin._id}
              admin={admin}
              acting={acting}
              onEdit={(a)    => setModal({ type: 'edit', admin: a })}
              onResetPw={(a) => setModal({ type: 'reset_pw', admin: a })}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {modal === 'create' && (
        <AdminModal onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
      {modal?.type === 'edit' && (
        <AdminModal admin={modal.admin} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
      {modal?.type === 'reset_pw' && (
        <ResetPasswordModal admin={modal.admin} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}
