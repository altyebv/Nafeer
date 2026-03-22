'use client';
import { useState } from 'react';
import { CONTRIBUTOR_STATUS, SUBJECT_MAP, TRACK_CONFIG, SUBJECTS_CATALOG_REF, getPipelineStage } from '../_constants';
import { Btn } from './ui/Btn';

const INTERVIEW_FIELDS = [
  { label: 'لماذا تريد المساهمة؟',      key: 'motivation'        },
  { label: 'ما الذي يُعلَّم بشكل سيئ؟', key: 'educationCritique' },
  { label: 'كيف تشرح فكرة صعبة؟',       key: 'teachingMoment'    },
  { label: 'الالتزام الأسبوعي',          key: 'weeklyCommitment'  },
  { label: 'المهمة الصغيرة',             key: 'microTask'         },
];

const COMMITMENT_LABELS = {
  occasional: 'بشكل متقطع',
  '2-3h':     '٢–٣ ساعات أسبوعياً',
  '5h+':      '٥ ساعات أو أكثر',
};

export function ContributorCard({ c, actionLoading, onAct, onDelete, onSetPassword }) {
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const st      = CONTRIBUTOR_STATUS[c.status] || CONTRIBUTOR_STATUS.pending;
  const subj    = SUBJECT_MAP[c.subject];
  const stage   = getPipelineStage(c);
  const hasAnswers        = !!c.interviewAnswers?.submittedAt;
  const hasDynamicAnswers = !!c.dynamicAnswersSubmittedAt;

  return (
    <div className="bg-ink-900/60 rounded-xl border border-ink-800/50 hover:border-ink-700/50 transition-all">
      <div className="p-5 flex items-start gap-4">

        {/* Avatar initial */}
        <div className="shrink-0 w-10 h-10 rounded-full bg-sand-900/60 border border-sand-800/50 flex items-center justify-center text-sand-400 font-bold font-arabic text-base">
          {(c.name || '؟').charAt(0)}
        </div>

        {/* Info column */}
        <div className="flex-1 min-w-0">

          {/* Name + status badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-sand-200 font-arabic">{c.name}</h3>

            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-arabic flex items-center gap-1.5 ${st.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
              {st.label}
            </span>

            {/* Pipeline stage chip — only for pending */}
            {stage && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-arabic ${stage.color}`}>
                {stage.label}
              </span>
            )}

            {c.onboarded && c.status === 'approved' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-green-900/50 bg-green-950/30 text-green-500 font-arabic">
                مكتمل
              </span>
            )}
            {!c.onboarded && c.status === 'approved' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-900/50 bg-amber-950/30 text-amber-500 font-arabic">
                ينتظر التأهيل
              </span>
            )}
          </div>

          {/* Email + username */}
          <p className="text-xs font-mono text-ink-500 mb-1" dir="ltr">{c.email}</p>
          {c.username && (
            <p className="text-xs font-mono text-sand-600/70 mb-2" dir="ltr">@{c.username}</p>
          )}

          {/* Role badge */}
          {c.roleId?.name && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-sand-800/40 bg-sand-900/20 text-sand-500 font-arabic">
                ◆ {c.roleId.name}
              </span>
              {c.roleId.subcategory && (
                <span className="text-[10px] text-ink-700 font-arabic">{c.roleId.subcategory}</span>
              )}
            </div>
          )}

          {/* Subject + background */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {subj ? (
              <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-arabic ${TRACK_CONFIG[subj.track]?.badge || 'border-ink-700 text-ink-400'}`}>
                {subj.nameAr}
              </span>
            ) : c.subject ? (
              <span className="text-[11px] px-2.5 py-1 rounded-lg border border-ink-700/40 text-ink-500 font-mono">
                {c.subject}
              </span>
            ) : null}
            {c.background && (
              <span className="text-[11px] text-ink-600 font-arabic truncate max-w-xs">{c.background}</span>
            )}
            {c.fieldOfStudy && !c.background && (
              <span className="text-[11px] text-ink-600 font-arabic truncate max-w-xs">{c.fieldOfStudy}</span>
            )}
          </div>

          {/* Subjects of interest — shown when no assigned subject yet */}
          {c.subjectsOfInterest?.length > 0 && !c.subject && (
            <div className="flex flex-wrap gap-1 mb-2">
              {c.subjectsOfInterest.map((sid) => {
                const name = SUBJECTS_CATALOG_REF.find((s) => s.id === sid)?.nameAr || sid;
                return (
                  <span
                    key={sid}
                    className="text-[10px] px-2 py-0.5 rounded-full font-arabic"
                    style={{ background: 'rgba(212,137,30,0.08)', color: 'var(--accent)', border: '1px solid rgba(212,137,30,0.2)' }}
                  >
                    {name}
                  </span>
                );
              })}
            </div>
          )}

          {/* Dynamic interview answers (role-based) */}
          {hasDynamicAnswers && (
            <div className="mt-2">
              <button
                onClick={() => setInterviewOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-mono transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                <span>{interviewOpen ? '▾' : '▸'}</span>
                <span>إجابات المقابلة</span>
                <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'rgba(212,137,30,0.12)', color: 'var(--accent)' }}>
                  {new Date(c.dynamicAnswersSubmittedAt).toLocaleDateString('en-GB')}
                </span>
              </button>

              {interviewOpen && (
                <div className="mt-3 space-y-3 pr-3 border-r-2 border-ink-800">
                  {(c.dynamicAnswers || []).map((a, i) => (
                    <div key={i}>
                      <p className="text-[10px] font-arabic text-ink-600 mb-1">{a.question}</p>
                      <p className="text-[11px] text-ink-400 leading-relaxed font-arabic whitespace-pre-wrap">{a.answer}</p>
                    </div>
                  ))}
                  {c.dynamicMicroTask && (
                    <div>
                      <p className="text-[10px] font-mono text-ink-600 mb-1">المهمة التطبيقية</p>
                      <p className="text-[11px] text-ink-400 leading-relaxed font-arabic whitespace-pre-wrap">{c.dynamicMicroTask}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Legacy interview answers */}
          {hasAnswers && (
            <div className="mt-2">
              <button
                onClick={() => setInterviewOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-mono transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                <span>{interviewOpen ? '▾' : '▸'}</span>
                <span>إجابات المقابلة</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{ background: 'rgba(212,137,30,0.12)', color: 'var(--accent)' }}
                >
                  {new Date(c.interviewAnswers.submittedAt).toLocaleDateString('en-GB')}
                </span>
              </button>

              {interviewOpen && (
                <div className="mt-3 space-y-3 pr-3 border-r-2 border-ink-800">
                  {INTERVIEW_FIELDS.map(({ label, key }) => {
                    const val = c.interviewAnswers[key];
                    if (!val) return null;
                    const display = key === 'weeklyCommitment' ? (COMMITMENT_LABELS[val] || val) : val;
                    return (
                      <div key={key}>
                        <p className="text-[10px] font-mono text-ink-600 mb-1">{label}</p>
                        <p className="text-[11px] text-ink-400 leading-relaxed font-arabic whitespace-pre-wrap">
                          {display}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          <p className="text-[10px] font-mono text-ink-800 mt-2.5">
            {new Date(c.createdAt).toLocaleDateString('en-GB')}
          </p>
        </div>

        {/* Actions column */}
        <div className="shrink-0 flex flex-col gap-1.5 min-w-[140px]">

          {c.status === 'pending' && (
            <>
              {hasAnswers ? (
                <>
                  <Btn variant="green" onClick={() => onSetPassword(c._id, c.name)}>
                    اعتماد + مرور
                  </Btn>
                  <Btn variant="ghost" loading={actionLoading === c._id + 'approve'} onClick={() => onAct(c._id, 'approve')}>
                    اعتماد فقط
                  </Btn>
                </>
              ) : (
                <Btn
                  variant="sand"
                  loading={actionLoading === c._id + 'send_interview'}
                  onClick={() => onAct(c._id, 'send_interview')}
                >
                  {c.interviewToken ? 'إعادة إرسال الرابط' : 'إرسال رابط المقابلة'}
                </Btn>
              )}
              <Btn variant="red" loading={actionLoading === c._id + 'reject'} onClick={() => onAct(c._id, 'reject')}>
                رفض
              </Btn>
            </>
          )}

          {c.status === 'approved' && (
            <>
              <Btn variant="sand" onClick={() => onSetPassword(c._id, c.name)}>
                {c.passwordHash ? 'تغيير المرور' : 'تعيين مرور'}
              </Btn>
              {!c.onboarded && (
                <Btn
                  variant="ghost"
                  loading={actionLoading === c._id + 'generate_onboard_link'}
                  onClick={() => onAct(c._id, 'generate_onboard_link')}
                >
                  رابط التأهيل
                </Btn>
              )}
            </>
          )}

          {c.status === 'rejected' && (
            <Btn
              variant="ghost"
              loading={actionLoading === c._id + 'reset_to_pending'}
              onClick={() => onAct(c._id, 'reset_to_pending')}
            >
              إعادة للانتظار
            </Btn>
          )}

          {/* Delete — inline confirm */}
          {deleteConfirm ? (
            <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-ink-800">
              <p className="text-[10px] text-red-400 font-arabic text-center">تأكيد الحذف؟</p>
              <Btn variant="red" loading={actionLoading === c._id + 'delete'} onClick={() => onDelete(c._id)}>
                حذف نهائي
              </Btn>
              <Btn variant="ghost" onClick={() => setDeleteConfirm(false)}>إلغاء</Btn>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="text-[11px] font-mono text-ink-700 hover:text-red-500 transition-colors mt-1 text-center py-1"
            >
              حذف
            </button>
          )}
        </div>
      </div>
    </div>
  );
}