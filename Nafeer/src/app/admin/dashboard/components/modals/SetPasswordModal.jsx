'use client';
import { useState } from 'react';
import { Modal } from '../ui/modal';

export function SetPasswordModal({ name, onClose, onSave }) {
  const [pw, setPw]           = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!pw.trim()) return;
    setLoading(true);
    await onSave(pw);
    setLoading(false);
  };

  return (
    <Modal title="تعيين كلمة مرور" onClose={onClose}>
      <p className="text-xs text-ink-500 font-mono mb-5 -mt-1">{name}</p>
      <input
        type="password"
        dir="ltr"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        placeholder="••••••••"
        autoFocus
        className="w-full px-4 py-3 rounded-xl bg-ink-800 border border-ink-700/60 text-sand-100 placeholder-ink-700 focus:outline-none focus:border-sand-700 font-mono mb-4 transition-all"
      />
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={loading || !pw.trim()}
          className="flex-1 py-2.5 bg-green-800 hover:bg-green-700 disabled:bg-ink-700 text-green-200 disabled:text-ink-600 font-bold rounded-xl text-sm transition-all font-arabic"
        >
          {loading ? 'جاري الحفظ...' : 'حفظ وتفعيل'}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 text-ink-500 hover:text-ink-300 text-sm transition-colors">
          إلغاء
        </button>
      </div>
    </Modal>
  );
}