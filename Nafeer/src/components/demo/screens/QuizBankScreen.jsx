'use client';

const MOCK_QUESTIONS = [
  { subject: 'الفيزياء', color: '#4A90D9', text: 'جسم كتلته ٥ كغ يتسارع بـ ٢ م/ث²، القوة المؤثرة عليه؟', type: 'اختيار من متعدد' },
  { subject: 'الرياضيات', color: '#9B59B6', text: 'إذا كان ق(س) = س² + ٣س - ٤، أوجد قيم س التي تُصفِّر الدالة.', type: 'حل مسألة' },
  { subject: 'الأحياء', color: '#27AE60', text: 'الميتوكوندريا هي الموقع الرئيسي لعملية التنفس الخلوي.', type: 'صح أم خطأ' },
  { subject: 'الكيمياء', color: '#E67E22', text: 'ما عدد إلكترونات المستوى الخارجي لذرة الكلور؟', type: 'اختيار من متعدد' },
];

export default function QuizBankScreen() {
  return (
    <div className="w-full" dir="rtl">
      {/* Header */}
      <div className="px-4 pt-3 pb-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 className="font-arabic text-sm font-bold" style={{ color: 'var(--text-primary)' }}>بنك الأسئلة</h2>
        <p className="font-arabic text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>آلاف الأسئلة · مرتّبة حسب المادة والمستوى</p>
      </div>

      {/* Filter bar - grayed */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {['الكل', 'الفيزياء', 'الرياضيات', 'الأحياء', 'الكيمياء'].map((f, i) => (
          <div key={f} className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-arabic"
            style={{
              background: i === 0 ? 'rgba(212,137,30,0.12)' : 'var(--bg-card)',
              border: `1px solid ${i === 0 ? 'rgba(212,137,30,0.28)' : 'var(--border-subtle)'}`,
              color: i === 0 ? 'var(--accent)' : 'var(--text-muted)',
              opacity: 0.5,
            }}>
            {f}
          </div>
        ))}
      </div>

      {/* Question rows - blurred */}
      <div className="px-4 flex flex-col gap-2 pb-4 relative">
        {MOCK_QUESTIONS.map((q, i) => (
          <div key={i} className="rounded-xl p-3.5"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              filter: 'blur(1.5px)',
              opacity: 0.45,
              pointerEvents: 'none',
            }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold"
                style={{ background: `${q.color}20`, color: q.color, fontSize: '9px' }}>
                {q.subject[0]}
              </div>
              <span className="font-arabic text-xs" style={{ color: q.color }}>{q.subject}</span>
              <span className="font-arabic text-xs mr-auto" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                {q.type}
              </span>
            </div>
            <p className="font-arabic text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{q.text}</p>
          </div>
        ))}

        {/* Coming soon overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl"
          style={{ background: 'rgba(14,12,9,0.70)', backdropFilter: 'blur(2px)' }}>
          <div className="rounded-2xl px-6 py-4 flex flex-col items-center gap-2 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(212,137,30,0.25)' }}>
            <span style={{ fontSize: '24px' }}>🔒</span>
            <p className="font-arabic text-sm font-bold" style={{ color: 'var(--text-primary)' }}>قريباً</p>
            <p className="font-arabic text-xs leading-loose" style={{ color: 'var(--text-muted)', maxWidth: '180px' }}>
              بنك الأسئلة يُطوَّر حالياً — آلاف الأسئلة من الامتحانات السابقة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
