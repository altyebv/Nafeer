// ─── The editor dashboard's «خطوتك التالية» ──────────────────────────────────
// Pure, so it can be tested: `everything` is the subject's lessons with their
// readiness ({ lesson, r, n, unitN }), `recent` the browser's recently opened
// list, `me` the member's id (components/editor/pages/DashboardNext.jsx).

// Which lesson to open, in order of what helps most: one the reviewer
// returned, the one being worked on, one ready to send, the first unstarted —
// all among the member's own lessons (docs/team-leads.md L4: a lesson is its
// owner's) — and then an unclaimed one to take. `me` is the member's id; with
// none (the owner viewing the editor) every lesson counts.
export function pickNextStep(everything, recent, me) {
  const all = me ? everything.filter((x) => x.lesson.owner === me) : everything;
  const returned = all.find((x) => x.lesson.reviewState?.returned);
  if (returned) return { x: returned, kicker: 'أُعيد إليك', title: `عالج ملاحظات المراجِع في «${returned.lesson.title}»`, body: 'كل ملاحظة مثبّتة في مكانها داخل الدرس. بعد معالجتها كلها يمكنك إعادة الإرسال.', cta: 'افتح الملاحظات' };

  const byId = Object.fromEntries(all.map((x) => [x.lesson.id, x]));
  const current = recent.map((r) => byId[r.id]).find((x) => x && x.r.done < 6 && x.lesson.atlasStatus === 'draft');
  if (current) return { x: current, kicker: 'تابع من حيث توقفت', title: `أكمل «${current.lesson.title}»`, body: `ينقصه: ${current.r.missing.join('، ')}.`, cta: 'تابع الدرس' };

  const ready = all.find((x) => x.r.done === 6 && x.lesson.atlasStatus === 'draft');
  if (ready) return { x: ready, kicker: 'جاهز', title: `أرسل «${ready.lesson.title}» للمراجعة`, body: 'الشروط الست مكتملة. المراجِع يقرأه ويعتمده أو يعيده بملاحظات.', cta: 'افتح وأرسل' };

  const fresh = all.find((x) => x.r.counts.sections === 0 && x.lesson.atlasStatus === 'draft');
  if (fresh) return { x: fresh, kicker: 'ابدأ', title: `ابدأ الدرس ${fresh.n} من الوحدة ${fresh.unitN}`, body: `${fresh.lesson.estimatedMinutes || 15} دقيقة تقريباً للطالب. اكتب عنواناً حقيقياً وملخصاً، ثم أضف قسمك الأول.`, cta: 'افتح الدرس' };

  const open = me && everything.find((x) => x.lesson.unclaimed && x.lesson.atlasStatus === 'draft');
  if (open) return { x: open, kicker: 'تولَّ درساً', title: `الدرس ${open.n} من الوحدة ${open.unitN} لم يتولّه أحد`, body: 'افتحه وتولَّه ليصير في عهدتك: تكتبه وحدك، ويُنسب إليك.', cta: 'افتح الدرس' };

  return null;
}

