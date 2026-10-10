// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE QUESTIONS — showcasing all question types
// ─────────────────────────────────────────────────────────────────────────────

export const PRACTICE_QUESTIONS = [
  // ── 1. MCQ (standard) ────────────────────────────────────────────────────
  {
    id: 'q1',
    type: 'MCQ',
    subjectAr: 'الفيزياء',
    subjectColor: '#4A90D9',
    initial: 'ف',
    typeAr: 'اختيار من متعدد',
    text: 'جسم كتلته ٥ كغ يتسارع بمعدل ٢ م/ث² — ما مقدار القوة المؤثرة عليه؟',
    concept: 'القانون الثاني لنيوتن',
    choices: [
      { id: 'a', text: '٢.٥ نيوتن', correct: false },
      { id: 'b', text: '١٠ نيوتن',  correct: true  },
      { id: 'c', text: '٧ نيوتن',   correct: false },
      { id: 'd', text: '١٥ نيوتن',  correct: false },
    ],
    explanation: 'القانون الثاني لنيوتن: ق = ك × ت → ٥ × ٢ = ١٠ نيوتن',
  },

  // ── 2. TABLE — read values and identify pattern ───────────────────────────
  {
    id: 'q2',
    type: 'TABLE',
    subjectAr: 'الفيزياء',
    subjectColor: '#4A90D9',
    initial: 'ف',
    typeAr: 'سؤال جدول',
    concept: 'القانون الثاني لنيوتن',
    text: 'ادرس الجدول التالي ثم اختر العبارة الصحيحة.',
    tableHeaders: ['الكتلة (كغ)', 'القوة (ن)', 'التسارع (م/ث²)'],
    tableRows: [
      ['٢', '١٠', '٥'],
      ['٤', '١٠', '٢.٥'],
      ['٥', '١٠', '٢'],
      ['١٠', '١٠', '?'],
    ],
    choices: [
      { id: 'a', text: 'التسارع في الصف الأخير = ٥ م/ث²',  correct: false },
      { id: 'b', text: 'التسارع في الصف الأخير = ١ م/ث²',  correct: true  },
      { id: 'c', text: 'التسارع في الصف الأخير = ٢ م/ث²',  correct: false },
      { id: 'd', text: 'التسارع في الصف الأخير = ٠.٥ م/ث²', correct: false },
    ],
    explanation: 'عند ثبات القوة، التسارع = ق ÷ ك = ١٠ ÷ ١٠ = ١ م/ث². كلما ضاعفت الكتلة، تناصف التسارع.',
  },

  // ── 3. SORT — arrange events chronologically ──────────────────────────────
  {
    id: 'q3',
    type: 'SORT',
    subjectAr: 'التاريخ',
    subjectColor: '#C0392B',
    initial: 'ت',
    typeAr: 'رتّب بالترتيب',
    concept: 'الثورة المهدية',
    text: 'رتّب أحداث الثورة المهدية من الأقدم إلى الأحدث.',
    items: [
      { id: 's1', text: 'معركة أم درمان ونهاية الدولة المهدية',  correctOrder: 4 },
      { id: 's2', text: 'إعلان المهدية من جزيرة أبا',             correctOrder: 1 },
      { id: 's3', text: 'سقوط الخرطوم ومقتل غردون باشا',          correctOrder: 3 },
      { id: 's4', text: 'هزيمة هيكس باشا في معركة شيكان',         correctOrder: 2 },
    ],
    explanation: 'الترتيب الصحيح: جزيرة أبا ١٨٨١ ← شيكان ١٨٨٣ ← سقوط الخرطوم ١٨٨٥ ← أم درمان ١٨٩٨.',
  },

  // ── 4. COMPARE — two-column matching ─────────────────────────────────────
  {
    id: 'q4',
    type: 'COMPARE',
    subjectAr: 'التاريخ',
    subjectColor: '#C0392B',
    initial: 'ت',
    typeAr: 'مقارنة',
    concept: 'الثورة المهدية vs ثورة عرابي',
    text: 'طابق كل وصف بالثورة المناسبة.',
    leftLabel:  'الثورة المهدية',
    rightLabel: 'ثورة عرابي',
    pairs: [
      { id: 'c1', text: 'قامت في السودان',              correct: 'LEFT'  },
      { id: 'c2', text: 'قامت في مصر',                  correct: 'RIGHT' },
      { id: 'c3', text: 'أسست دولة مستقلة فعلياً',      correct: 'LEFT'  },
      { id: 'c4', text: 'قمعتها القوات البريطانية ١٨٨٢', correct: 'RIGHT' },
    ],
    explanation: 'الثورة المهدية: السودان، أسست دولة عاشت ١٣ عاماً. ثورة عرابي: مصر، قمعتها بريطانيا عام ١٨٨٢.',
  },

  // ── 5. SELF_EVAL — explain/mention-two open question ─────────────────────
  {
    id: 'q5',
    type: 'SELF_EVAL',
    subjectAr: 'الأحياء',
    subjectColor: '#27AE60',
    initial: 'أح',
    typeAr: 'تقييم ذاتي',
    concept: 'التنفس الخلوي',
    text: 'اذكر سببَين يجعلان الميتوكوندريا تختلف عن سائر العضيات الخلوية، ثم قيّم إجابتك.',
    hints: [
      'تملك DNA خاصاً بها',
      'تملك غشاءً مزدوجاً (غشاء داخلي ومطوي)',
      'تنقسم باستقلالية عن انقسام الخلية',
      'نظرية الطفيل الداخلي: كانت بكتيريا مستقلة',
    ],
    selfRubric: [
      { label: 'ذكرت نقطتين صحيحتين', points: '٢' },
      { label: 'ذكرت نقطة واحدة صحيحة', points: '١' },
      { label: 'لم أتذكر — سأراجع الدرس', points: '٠' },
    ],
  },

  // ── 6. IMAGE_MARKER — tap regions on diagram ─────────────────────────────
  {
    id: 'q6',
    type: 'IMAGE_MARKER',
    subjectAr: 'الأحياء',
    subjectColor: '#27AE60',
    initial: 'أح',
    typeAr: 'تفاعل مع الصورة',
    concept: 'مكونات الخلية الحيوانية',
    text: 'طابق كل رقم في الرسم بالعضية الصحيحة.',
    // Placeholder cell diagram — markers reference relative positions
    imagePlaceholder: { color: '#27AE60', label: 'مقطع تخطيطي للخلية الحيوانية' },
    markers: [
      { id: 'm1', x: 0.50, y: 0.45, label: '١', answer: 'النواة' },
      { id: 'm2', x: 0.72, y: 0.35, label: '٢', answer: 'الميتوكوندريا' },
      { id: 'm3', x: 0.30, y: 0.65, label: '٣', answer: 'الريبوسوم' },
      { id: 'm4', x: 0.60, y: 0.70, label: '٤', answer: 'الشبكة الإندوبلازمية' },
    ],
    // Multiple choice per marker for demo interactivity
    choices: [
      { id: 'a', text: '١ = النواة · ٢ = الميتوكوندريا',          correct: true  },
      { id: 'b', text: '١ = الميتوكوندريا · ٢ = النواة',          correct: false },
      { id: 'c', text: '١ = الريبوسوم · ٢ = الشبكة الإندوبلازمية', correct: false },
    ],
    explanation: 'النواة دائماً في مركز الخلية (١)، والميتوكوندريا أكبر من الريبوسومات وبيضاوية الشكل (٢).',
  },

  // ── 7. TRUE/FALSE ─────────────────────────────────────────────────────────
  {
    id: 'q7',
    type: 'MCQ',
    subjectAr: 'الكيمياء',
    subjectColor: '#E67E22',
    initial: 'ك',
    typeAr: 'صح أم خطأ',
    text: 'ذرة الكلور (العدد الذري ١٧) تحتوي على ٧ إلكترونات في مستواها الخارجي.',
    concept: 'التوزيع الإلكتروني',
    choices: [
      { id: 'a', text: 'صح', correct: true  },
      { id: 'b', text: 'خطأ',  correct: false },
    ],
    explanation: 'التوزيع الإلكتروني: 2,8,7 — المستوى الثالث يحمل ٧ إلكترونات ويحتاج ١ لاكتماله.',
  },
];


export const MOCK_EXAMS = {
  MINISTRY: [
    { id: 'e1', title: 'امتحان الفيزياء، الشهادة الثانوية', year: 2023, minutes: 90, questions: 40 },
    { id: 'e2', title: 'امتحان الكيمياء، الشهادة الثانوية', year: 2023, minutes: 90, questions: 40 },
    { id: 'e3', title: 'امتحان الأحياء، الشهادة الثانوية', year: 2022, minutes: 90, questions: 40 },
  ],
  SCHOOL: [
    { id: 'e4', title: 'امتحان الكيمياء، نصف السنة', year: 2023, minutes: 60, questions: 30 },
    { id: 'e5', title: 'اختبار الأحياء الشهري', year: 2023, minutes: 45, questions: 20 },
  ],
};
