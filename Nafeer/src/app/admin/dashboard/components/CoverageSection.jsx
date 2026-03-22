'use client';
import { useState, useEffect, useCallback } from 'react';
import { SUBJECTS_CATALOG_REF } from '../_constants';
import { SectionHeader, StatusChip, EmptyState, Spinner } from './ui/shared';

const LVL = {
  high:   { bar: '#22c55e', text: 'text-green-400',  bg: 'bg-green-900/20'  },
  medium: { bar: '#f59e0b', text: 'text-amber-400',  bg: 'bg-amber-900/20'  },
  low:    { bar: '#f97316', text: 'text-orange-400', bg: 'bg-orange-900/20' },
  none:   { bar: '#374151', text: 'text-ink-600',    bg: 'bg-ink-800/30'   },
};

const avgLevel = (avg) => avg >= 80 ? 'high' : avg >= 40 ? 'medium' : avg > 0 ? 'low' : 'none';

export function CoverageSection() {
  const [subjectId, setSubjectId] = useState('');
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);

  const load = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/coverage/${subjectId}`);
      const json = await res.json();
      setData(json.ok ? json.data : null);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <SectionHeader title="خريطة التغطية" description="نسبة اكتمال المحتوى لكل درس لكل مادة">
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-ink-800 border border-ink-700/60 text-sand-200 text-sm font-arabic focus:outline-none focus:border-sand-700 transition-colors"
          >
            <option value="">اختر مادة...</option>
            {SUBJECTS_CATALOG_REF.map((s) => (
              <option key={s.id} value={s.id}>{s.nameAr} — {s.id}</option>
            ))}
          </select>
          {subjectId && (
            <button onClick={load} className="px-3 py-2 rounded-lg border border-ink-700/60 text-ink-500 hover:text-ink-300 hover:border-ink-600 text-xs font-mono transition-all">
              ↺ تحديث
            </button>
          )}
        </div>
      </SectionHeader>

      <div className="px-8 pb-8">
        {!subjectId ? (
          <EmptyState text="اختر مادة لعرض خريطة التغطية" />
        ) : loading ? (
          <Spinner />
        ) : !data ? (
          <EmptyState text="لا توجد بيانات — المادة قد لا تكون مُهيَّأة بعد" />
        ) : (
          <div className="space-y-10">
            {(data.units || []).map((unit) => {
              const al = avgLevel(unit.avgCoverage);
              return (
                <div key={unit.unitId}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-bold text-sand-300 font-arabic">{unit.title}</h3>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-lg ${LVL[al].bg} ${LVL[al].text}`}>
                      {unit.avgCoverage}%
                    </span>
                    <div className="flex-1 h-px bg-ink-800" />
                    <span className="text-[10px] font-mono text-ink-700">
                      {unit.approvedLessons}/{unit.totalLessons} معتمد
                    </span>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-ink-800/50">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="bg-ink-900/80 border-b border-ink-800/60">
                          <th className="text-right py-2.5 px-4 text-ink-600 font-arabic font-normal">الدرس</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">الحالة</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">أقسام</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">مفاهيم</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">تغذية</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">أسئلة</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center min-w-[110px]">تغطية</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(unit.lessons || []).map((lesson, i) => {
                          const lvl = lesson.coverageLevel || 'none';
                          const c   = LVL[lvl];
                          return (
                            <tr
                              key={lesson.lessonId}
                              className={`border-b border-ink-900/60 hover:bg-ink-800/20 transition-colors ${i % 2 === 0 ? '' : 'bg-ink-950/20'}`}
                            >
                              <td className="py-3 px-4 font-arabic text-sand-400 text-[12px] max-w-[220px] truncate">{lesson.title}</td>
                              <td className="py-3 px-3 text-center"><StatusChip status={lesson.status} /></td>
                              <td className="py-3 px-3 text-center text-ink-500">{lesson.sections ?? '—'}</td>
                              <td className="py-3 px-3 text-center text-ink-500">{lesson.concepts ?? '—'}</td>
                              <td className="py-3 px-3 text-center text-ink-500">{lesson.feedItems ?? '—'}</td>
                              <td className="py-3 px-3 text-center text-ink-500">{lesson.questions ?? '—'}</td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full bg-ink-800">
                                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${lesson.coverageScore}%`, background: c.bar }} />
                                  </div>
                                  <span className={`text-[11px] font-mono w-7 text-right ${c.text}`}>{lesson.coverageScore}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}