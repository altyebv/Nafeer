'use client';
import { useState } from 'react';
import { Modal } from '../ui/modal';

export function LinkModal({ name, link, label = 'رابط التأهيل', onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const isInterview = label === 'رابط المقابلة';

  return (
    <Modal title={label} onClose={onClose}>
      <p className="text-xs text-ink-500 font-arabic mb-1">
        أرسل هذا الرابط إلى <span className="text-sand-400">{name}</span> عبر البريد الإلكتروني
      </p>
      <p className="text-xs text-ink-600 mb-4">
        {isInterview ? 'الرابط صالح لمدة 14 يوماً' : 'الرابط صالح لمدة 7 أيام'}
      </p>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-ink-800 border border-ink-700/60 mb-4">
        <p dir="ltr" className="flex-1 text-xs font-mono text-sand-300 break-all leading-relaxed select-all">
          {link}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={copy}
          className={`flex-1 py-2.5 font-bold rounded-xl text-sm transition-all font-arabic ${
            copied
              ? 'bg-green-800 text-green-200'
              : 'bg-sand-600 hover:bg-sand-500 text-ink-950'
          }`}
        >
          {copied ? '✓ تم النسخ' : 'نسخ الرابط'}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 text-ink-500 hover:text-ink-300 text-sm transition-colors">
          إغلاق
        </button>
      </div>
    </Modal>
  );
}