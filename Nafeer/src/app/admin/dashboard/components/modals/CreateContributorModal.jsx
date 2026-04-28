'use client';
import { useState } from 'react';
import { SUBJECTS_CATALOG_REF } from '../../constants';
import { Modal } from '../ui/modal';

const FIELDS = [
  { key: 'name',      label: 'الاسم الكامل',      placeholder: 'أحمد محمد',        required: true },
  { key: 'username',  label: 'اسم المستخدم',      placeholder: 'ahmad123',         required: true, dir: 'ltr' },
  { key: 'email',     label: 'البريد الإلكتروني', placeholder: 'user@example.com', required: true, type: 'email', dir: 'ltr' },
  { key: 'password',  label: 'كلمة المرور',       placeholder: '••••••••',         required: true, type: 'password', dir: 'ltr' },
];

const GENDERS = [
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' },
];

export function CreateContributorModal({ onClose, onCreated }) {
  const [form, setForm]       = useState({ name: '', username: '', email: '', gender: '', subject: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res  = await fetch('/api/admin/contributors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.message || 'حدث خطأ'); return; }
    onCreated();
  };

  return (
    <Modal title="إضافة مساهم جديد" onClose={onClose}>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm font-arabic">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {FIELDS.map(({ key, label, placeholder, required, dir, type }) => (
          <div key={key}>
            <label className="block text-xs text-ink-500 mb-1.5 font-mono">{label}</label>
            <input
              type={type || 'text'}
              dir={dir}
              required={required}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full px-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700/60 text-sand-100 placeholder-ink-700 focus:outline-none focus:border-sand-700 text-sm transition-all font-arabic"
            />
          </div>
        ))}

        <div>
          <label className="block text-xs text-ink-500 mb-1.5 font-mono">الجنس</label>
          <select
            required
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700/60 text-sand-100 focus:outline-none focus:border-sand-700 text-sm transition-all font-arabic"
          >
            <option value="" disabled>اختر الجنس...</option>
            {GENDERS.map((gender) => (
              <option key={gender.value} value={gender.value}>{gender.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-ink-500 mb-1.5 font-mono">المادة</label>
          <select
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700/60 text-sand-100 focus:outline-none focus:border-sand-700 text-sm transition-all font-arabic"
          >
            <option value="" disabled>اختر المادة...</option>
            {['COMMON', 'SCIENCE', 'LITERARY'].map((track) => (
              <optgroup key={track} label={track === 'COMMON' ? 'مشترك' : track === 'SCIENCE' ? 'علمي' : 'أدبي'}>
                {SUBJECTS_CATALOG_REF.filter((s) => s.track === track).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameAr}{s.isMajor ? ' (تخصص)' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-sand-600 hover:bg-sand-500 disabled:bg-ink-700 text-ink-950 disabled:text-ink-600 font-bold rounded-xl text-sm transition-all font-arabic"
          >
            {loading ? 'جاري الإضافة...' : 'إضافة'}
          </button>
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-ink-500 hover:text-ink-300 text-sm transition-colors">
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
}