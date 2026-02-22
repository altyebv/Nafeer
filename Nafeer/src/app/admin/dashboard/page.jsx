'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG = {
  pending:  { label: 'في الانتظار', color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-700/40' },
  approved: { label: 'معتمد',       color: 'text-green-400',  bg: 'bg-green-900/30 border-green-700/40'  },
  rejected: { label: 'مرفوض',       color: 'text-red-400',    bg: 'bg-red-900/30 border-red-700/40'      },
};

const TABS = ['all', 'pending', 'approved', 'rejected'];
const TAB_LABELS = { all: 'الكل', pending: 'انتظار', approved: 'معتمدون', rejected: 'مرفوضون' };

export default function AdminDashboard() {
  const router = useRouter();
  const [contributors, setContributors] = useState([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Create contributor modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', subject: '', background: '', password: '' });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Password modal state
  const [passwordModal, setPasswordModal] = useState(null); // { id, name }
  const [newPassword, setNewPassword] = useState('');

  const fetchContributors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contributors?status=${tab}`);
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setContributors(data.contributors || []);
    } finally {
      setLoading(false);
    }
  }, [tab, router]);

  useEffect(() => { fetchContributors(); }, [fetchContributors]);

  const handleAction = async (id, action, extra = {}) => {
    setActionLoading(id + action);
    await fetch('/api/admin/contributors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, ...extra }),
    });
    setActionLoading(null);
    fetchContributors();
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    setActionLoading(id + 'delete');
    await fetch('/api/admin/contributors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setActionLoading(null);
    fetchContributors();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    const res = await fetch('/api/admin/contributors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    const data = await res.json();
    setCreateLoading(false);
    if (!res.ok) { setCreateError(data.message); return; }
    setShowCreate(false);
    setCreateForm({ name: '', email: '', subject: '', background: '', password: '' });
    setTab('approved');
    fetchContributors();
  };

  const handleSetPassword = async () => {
    if (!newPassword.trim()) return;
    await handleAction(passwordModal.id, 'set_password', { password: newPassword });
    setPasswordModal(null);
    setNewPassword('');
  };

  const handleSignOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const counts = { pending: 0, approved: 0, rejected: 0 };
  contributors.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100" dir="rtl">
      {/* Top bar */}
      <header className="border-b border-ink-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-arabic font-bold text-sand-400">نافير</span>
          <span className="text-xs px-2 py-0.5 rounded font-mono border border-ink-700 text-ink-500">ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-sand-600 hover:bg-sand-500 text-ink-950 font-bold rounded-lg text-sm transition-all"
          >
            + إضافة مساهم
          </button>
          <button
            onClick={handleSignOut}
            className="text-xs text-ink-600 hover:text-red-400 transition-colors font-mono"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'في الانتظار', count: contributors.filter(c=>c.status==='pending').length, color: 'text-yellow-400' },
            { label: 'معتمدون',     count: contributors.filter(c=>c.status==='approved').length, color: 'text-green-400' },
            { label: 'مرفوضون',    count: contributors.filter(c=>c.status==='rejected').length, color: 'text-red-400' },
          ].map((s, i) => (
            <div key={i} className="glass rounded-xl border border-ink-700/40 p-5 text-center">
              <div className={`text-4xl font-bold font-mono mb-1 ${s.color}`}>{s.count}</div>
              <div className="text-xs text-ink-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-mono transition-all
                ${tab === t
                  ? 'bg-sand-700/40 text-sand-300 border border-sand-700/50'
                  : 'text-ink-500 hover:text-ink-300 border border-transparent'
                }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-ink-600 font-mono text-sm">LOADING...</div>
        ) : contributors.length === 0 ? (
          <div className="text-center py-20 text-ink-600">لا يوجد مساهمون في هذه الفئة</div>
        ) : (
          <div className="space-y-3">
            {contributors.map((c) => {
              const sc = STATUS_CONFIG[c.status];
              const isActing = (action) => actionLoading === c._id + action;
              return (
                <div key={c._id} className="glass rounded-xl border border-ink-700/40 p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-sand-200">{c.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                          {sc.label}
                        </span>
                        {c.passwordHash && (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-green-800/40 bg-green-900/20 text-green-600">
                            كلمة مرور ✓
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-ink-400 font-mono mb-2">{c.email}</p>
                      <div className="flex gap-4 text-xs text-ink-500">
                        <span>📚 {c.subject}</span>
                        <span>🎓 {c.background}</span>
                      </div>
                      {c.motivation && (
                        <p className="text-xs text-ink-600 mt-2 italic">"{c.motivation}"</p>
                      )}
                      <p className="text-xs text-ink-700 mt-2 font-mono">
                        {new Date(c.createdAt).toLocaleDateString('ar-SD')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {c.status === 'pending' && (
                        <>
                          <button
                            onClick={() => setPasswordModal({ id: c._id, name: c.name })}
                            className="px-3 py-1.5 bg-green-900/50 hover:bg-green-800/60 border border-green-700/50 text-green-400 text-xs rounded-lg transition-all font-mono"
                          >
                            اعتماد + كلمة مرور
                          </button>
                          <button
                            onClick={() => handleAction(c._id, 'approve')}
                            disabled={isActing('approve')}
                            className="px-3 py-1.5 bg-ink-800 hover:bg-ink-700 border border-ink-600/50 text-ink-300 text-xs rounded-lg transition-all font-mono"
                          >
                            اعتماد بدون مرور
                          </button>
                          <button
                            onClick={() => handleAction(c._id, 'reject')}
                            disabled={isActing('reject')}
                            className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-800/40 text-red-500 text-xs rounded-lg transition-all font-mono"
                          >
                            رفض
                          </button>
                        </>
                      )}
                      {c.status === 'approved' && (
                        <button
                          onClick={() => setPasswordModal({ id: c._id, name: c.name })}
                          className="px-3 py-1.5 bg-sand-900/40 hover:bg-sand-800/50 border border-sand-700/40 text-sand-400 text-xs rounded-lg transition-all font-mono"
                        >
                          {c.passwordHash ? 'تغيير المرور' : 'تعيين مرور'}
                        </button>
                      )}
                      {c.status === 'rejected' && (
                        <button
                          onClick={() => handleAction(c._id, 'reset_to_pending')}
                          className="px-3 py-1.5 bg-ink-800 hover:bg-ink-700 border border-ink-600 text-ink-400 text-xs rounded-lg transition-all font-mono"
                        >
                          إعادة للانتظار
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="px-3 py-1.5 text-ink-700 hover:text-red-500 text-xs transition-colors font-mono"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Contributor Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-ink-900 border border-ink-700 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-sand-300 mb-6">إضافة مساهم جديد</h2>
            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm">{createError}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { key: 'name', label: 'الاسم', placeholder: 'الاسم الكامل' },
                { key: 'email', label: 'البريد الإلكتروني', placeholder: 'email@example.com', dir: 'ltr' },
                { key: 'subject', label: 'المادة', placeholder: 'مثال: الرياضيات' },
                { key: 'background', label: 'الخلفية', placeholder: 'اختياري' },
                { key: 'password', label: 'كلمة المرور', placeholder: '••••••••', type: 'password', dir: 'ltr' },
              ].map(({ key, label, placeholder, dir, type }) => (
                <div key={key}>
                  <label className="block text-xs text-ink-500 mb-1 font-mono">{label}</label>
                  <input
                    type={type || 'text'}
                    dir={dir}
                    required={key !== 'background'}
                    value={createForm[key]}
                    onChange={(e) => setCreateForm({ ...createForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 text-sm transition-all"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2.5 bg-sand-600 hover:bg-sand-500 disabled:bg-ink-700 text-ink-950 disabled:text-ink-500 font-bold rounded-xl text-sm transition-all"
                >
                  {createLoading ? 'جاري الإضافة...' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateError(''); }}
                  className="px-4 py-2.5 text-ink-500 hover:text-ink-300 text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-ink-900 border border-ink-700 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-sand-300 mb-1">تعيين كلمة مرور</h2>
            <p className="text-xs text-ink-500 mb-5 font-mono">{passwordModal.name}</p>
            <input
              type="password"
              dir="ltr"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="كلمة المرور الجديدة"
              className="w-full px-4 py-3 rounded-xl bg-ink-800 border border-ink-700 text-sand-100 placeholder-ink-600 focus:outline-none focus:border-sand-600 font-mono mb-4 transition-all"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSetPassword}
                className="flex-1 py-2.5 bg-green-800 hover:bg-green-700 text-green-200 font-bold rounded-xl text-sm transition-all"
              >
                حفظ وتفعيل
              </button>
              <button
                onClick={() => { setPasswordModal(null); setNewPassword(''); }}
                className="px-4 py-2.5 text-ink-500 hover:text-ink-300 text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
