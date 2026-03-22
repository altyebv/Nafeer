'use client';
import { useState, useEffect, useCallback } from 'react';
import { REVIEW_TYPE, SUBJECT_MAP, SUBJECTS_CATALOG_REF, TRACK_CONFIG } from '../_constants';
import { SectionHeader, StatusChip, EmptyState, Spinner } from './ui/shared';
import { Btn } from './ui/Btn';

export function ReviewQueueSection({ onTotalChange, onUnauthorized }) {
  const [subjectId, setSubjectId]    = useState('');
  const [queue, setQueue]            = useState({ lessons: [], concepts: [], feedItems: [], questions: [], total: 0 });
  const [loading, setLoading]        = useState(false);
  const [actLoading, setActLoading]  = useState(null);
  const [rejectTarget, setRejectTgt] = useState(null);
  const [rejectNote, setRejectNote]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url  = subjectId ? `/api/admin/review-queue?subjectId=${subjectId}` : '/api/admin/review-queue';
      const res  = await fetch(url);
      if (res.status === 401) { onUnauthorized(); return; }
      const data = await res.json();
      const q    = data.data || { lessons: [], concepts: [], feedItems: [], questions: [], total: 0 };
      setQueue(q);
      onTotalChange(q.total);
    } finally {
      setLoading(false);
    }
  }, [subjectId, onUnauthorized, onTotalChange]);

  useEffect(() => { load(); }, [load]);

  const approve = async (contentId, type) => {
    setActLoading(contentId + 'approve');
    await fetch('/api/admin/review-queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, type, status: 'approved' }),
    });
    setActLoading(null);
    load();
  };

  const doReject = async () => {
    if (!rejectTarget) return;
    const { contentId, type } = rejectTarget;
    setActLoading(contentId + 'reject');
    await fetch('/api/admin/review-queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, type, status: 'draft', note: rejectNote }),
    });
    setActLoading(null);
    setRejectTgt(null);
    setRejectNote('');
    load();
  };

  const byType = {};
  ['lesson', 'concept', 'feedItem', 'question'].forEach((t) => {
    const key  = t === 'feedItem' ? 'feedItems' : t + 's';
    byType[t]  = (queue[key] || []).map((i) => ({ ...i, type: t }));
  });

  return (
    <div>
      <SectionHeader title="طابور المراجعة" description="المحتوى المُرسل من المساهمين وينتظر الاعتماد">
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-ink-800 border border-ink-700/60 text-sand-200 text-sm font-arabic focus:outline-none focus:border-sand-700 transition-colors"
          >
            <option value="">كل المواد</option>
            {SUBJECTS_CATALOG_REF.map((s) => (
              <option key={s.id} value={s.id}>{s.nameAr}</option>
            ))}
          </select>
          {queue.total > 0 && (
            <span className="text-sm font-mono text-amber-400">{queue.total} عنصر</span>
          )}
          <button onClick={load} className="px-3 py-2 rounded-lg border border-ink-700/60 text-ink-500 hover:text-ink-300 hover:border-ink-600 text-xs font-mono transition-all">
            ↺ تحديث
          </button>
        </div>
      </SectionHeader>

      <div className="px-8 pb-8">
        {loading ? (
          <Spinner />
        ) : queue.total === 0 ? (
          <EmptyState text="لا يوجد محتوى في الطابور" sub="المساهمون يضغطون «إرسال للمراجعة» من محرر الدروس" />
        ) : (
          <div className="space-y-8">
            {['lesson', 'concept', 'feedItem', 'question'].map((type) => {
              const items = byType[type] || [];
              if (items.length === 0) return null;
              const t = REVIEW_TYPE[type];

              return (
                <section key={type}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-arabic flex items-center gap-1.5 ${t.color}`}>
                      <span>{t.icon}</span>{t.label}
                    </span>
                    <span className="text-xs font-mono text-ink-600">{items.length}</span>
                    <div className="flex-1 h-px bg-ink-800" />
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => {
                      const subj         = SUBJECT_MAP[item.subjectId];
                      const isRejectOpen = rejectTarget?.contentId === item.contentId;

                      return (
                        <div key={item.contentId} className="bg-ink-900/60 rounded-xl border border-ink-800/50 overflow-hidden">
                          <div className="p-4 flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {subj && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded border font-arabic ${TRACK_CONFIG[subj.track]?.badge || 'border-ink-700 text-ink-400'}`}>
                                    {subj.nameAr}
                                  </span>
                                )}
                                {item.itemType && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-ink-700/40 text-ink-600">
                                    {item.itemType}
                                  </span>
                                )}
                                {item.difficulty && (
                                  <span className="text-[10px] font-mono text-ink-700">{'★'.repeat(item.difficulty)}</span>
                                )}
                                <span className="text-[10px] font-mono text-ink-700">v{item.version}</span>
                              </div>
                              <p className="text-sm text-sand-300 font-arabic leading-relaxed">{item.label}</p>
                              <p className="text-[10px] font-mono text-ink-700 mt-1.5">
                                {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="shrink-0 flex flex-col gap-1.5 min-w-[100px]">
                              <Btn small variant="green" loading={actLoading === item.contentId + 'approve'} onClick={() => approve(item.contentId, item.type)}>
                                ✓ اعتماد
                              </Btn>
                              <Btn small variant="red" onClick={() => { setRejectTgt({ contentId: item.contentId, type: item.type }); setRejectNote(''); }}>
                                ✗ إرجاع
                              </Btn>
                            </div>
                          </div>

                          {isRejectOpen && (
                            <div className="px-4 pb-4 border-t border-ink-800/60 pt-3 bg-red-950/10">
                              <p className="text-xs text-red-400 font-arabic mb-2">ملاحظة الإرجاع (اختياري)</p>
                              <textarea
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                placeholder="سبب الإرجاع..."
                                rows={2}
                                autoFocus
                                className="w-full px-3 py-2 rounded-lg bg-ink-900 border border-red-900/40 text-ink-200 placeholder-ink-700 text-sm font-arabic resize-none focus:outline-none focus:border-red-700/60 transition-colors"
                              />
                              <div className="flex gap-2 mt-2">
                                <Btn small variant="red" loading={actLoading === item.contentId + 'reject'} onClick={doReject}>
                                  تأكيد الإرجاع
                                </Btn>
                                <Btn small variant="ghost" onClick={() => setRejectTgt(null)}>إلغاء</Btn>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}