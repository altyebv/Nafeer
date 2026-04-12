// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA — Single source of truth for all demo content.
// ─────────────────────────────────────────────────────────────────────────────

export const SUBJECT_COLORS = {
  physics:   '#4A90D9',
  chemistry: '#E67E22',
  biology:   '#27AE60',
  math:      '#9B59B6',
  history:   '#C0392B',
  arabic:    '#16A085',
  islamic:   '#1ABC9C',
  geography: '#2980B9',
  english:   '#95A5A6',
};

export const DEMO_USER = {
  nameAr:         'يوسف',
  streak:         7,
  xp:             1240,
  xpToNext:       2000,
  dailyGoalDone:  2,
  dailyGoalTotal: 5,
};

export const SUBJECTS_BY_PATH = {
  SCIENCE: [
    { id: 's1', nameAr: 'الفيزياء',      key: 'physics',   initial: 'ف',  progress: 35 },
    { id: 's2', nameAr: 'الرياضيات',     key: 'math',      initial: 'ر',  progress: 52 },
    { id: 's3', nameAr: 'الأحياء',       key: 'biology',   initial: 'أح', progress: 18 },
    { id: 's4', nameAr: 'الكيمياء',      key: 'chemistry', initial: 'ك',  progress: 40 },
  ],
  LITERARY: [
    { id: 's1', nameAr: 'التاريخ',       key: 'history',   initial: 'ت',  progress: 42 },
    { id: 's2', nameAr: 'الجغرافيا',     key: 'geography', initial: 'ج',  progress: 28 },
    { id: 's3', nameAr: 'اللغة العربية', key: 'arabic',    initial: 'ع',  progress: 61 },
    { id: 's4', nameAr: 'الاقتصاد',      key: 'math',      initial: 'اق', progress: 33 },
  ],
};

export const DEMO_SUBJECTS = SUBJECTS_BY_PATH.SCIENCE;

export const FOCUS_BY_PATH = {
  SCIENCE: {
    subjectAr:  'الفيزياء',
    subjectKey: 'physics',
    initial:    'ف',
    lessonTitle: 'القانون الثاني لنيوتن',
    unitAr:     'الوحدة الثانية · ٣ من ٨ أقسام',
    progress:   35,
    color:      '#4A90D9',
  },
  LITERARY: {
    subjectAr:  'التاريخ',
    subjectKey: 'history',
    initial:    'ت',
    lessonTitle: 'الثورة المهدية',
    unitAr:     'الوحدة الثالثة · ٢ من ٦ أقسام',
    progress:   28,
    color:      '#C0392B',
  },
};

export const DEMO_LESSON_PHYSICS = {
  subjectName:    'الفيزياء',
  subjectKey:     'physics',
  unitName:       'الوحدة الثانية: الحركة والقوى',
  lessonTitle:    'القانون الثاني لنيوتن',
  totalSections:  8,
  currentSection: 3,
  hook: 'لماذا تحتاج شاحنة إلى محرك أقوى بكثير من سيارة عادية للتحرك بنفس السرعة؟',
  orientation: {
    icon: '⚡',
    points: [
      'القانون الثاني لنيوتن وصياغته الرياضية الكاملة',
      'حساب القوة من الكتلة والتسارع بالمعادلة الأساسية',
      'الفرق الجوهري بين الكتلة والوزن وسبب الخلط بينهما',
      'تطبيق المعادلة في مسائل واقعية خطوة بخطوة',
    ],
    estimatedMins: 5,
  },
  checkpoint: {
    question:     'جسم كتلته ٢ كيلوغرام يتسارع بمقدار ٥ م/ث²، ما مقدار القوة المؤثرة عليه؟',
    options:      ['٢.٥ نيوتن', '٧ نيوتن', '١٠ نيوتن', '٣ نيوتن'],
    correctIndex: 2,
    explanation:  'باستخدام المعادلة الأساسية: ق = ك × ت، نعوّض ق = ٢ × ٥ = ١٠ نيوتن.',
  },
  complete: {
    xpGained:    45,
    streakBefore: 7,
    forwardPull: 'أنت على بُعد درس واحد من إكمال الوحدة الثانية كاملةً! 🎯',
  },
  blocks: [
    { id: 'b1', type: 'HEADING', level: 2, content: 'القانون الثاني لنيوتن' },
    { id: 'b2', type: 'TEXT', content: 'ينص القانون الثاني على أن القوة المحصّلة تساوي حاصل ضرب الكتلة في التسارع. كلّما زادت كتلة الجسم، احتجت إلى قوة أكبر لتُحدث نفس التسارع.' },
    { id: 'b3', type: 'HIGHLIGHT_BOX', style: 'DEFINITION', title: 'تعريف', content: 'القوة المحصّلة: محصّلة جميع القوى المؤثرة على جسم ما. وحدتها النيوتن، وهي كمية متجهة لها مقدار واتجاه.' },
    { id: 'b4', type: 'ARABIC_FORMULA', caption: 'المعادلة الأساسية', lhs: 'ق', rhs: 'ك × ت', legend: [{ sym: 'ق', meaning: 'القوة (نيوتن)' }, { sym: 'ك', meaning: 'الكتلة (كيلوغرام)' }, { sym: 'ت', meaning: 'التسارع (م/ث²)' }] },
    { id: 'b4b', type: 'IMAGE_PLACEHOLDER', caption: 'مخطط الجسم الحر', description: 'الجسم تؤثر عليه قوة محصّلة نحو اليمين فيتسارع في اتجاهها.', color: '#4A90D9', icon: 'diagram' },
    { id: 'b5', type: 'EXAMPLE', caption: 'مثال — خطوة بخطوة', interactive: true, steps: ['جسم كتلته ٤ كيلوغرام يتسارع بمقدار ٣ م/ث². أوجد القوة.', 'نطبّق المعادلة: ق = ك × ت', 'نعوّض القيم: ق = ٤ × ٣', 'الناتج: ق = ١٢ نيوتن ✓'] },
    { id: 'b5b', type: 'TABLE', caption: 'أمثلة مقارنة — ق = ك × ت', headers: ['الكتلة (كغ)', 'التسارع (م/ث²)', 'القوة (ن)'], rows: [['١', '١٠', '١٠'], ['٢', '١٠', '٢٠'], ['٤', '٣', '١٢'], ['١٠', '٢', '٢٠']] },
    { id: 'b6', type: 'HIGHLIGHT_BOX', style: 'WARNING', title: 'تنبيه', content: 'لا تخلط بين الكتلة والوزن. الكتلة ثابتة بالكيلوغرام، أما الوزن فقوة تساوي ك × جـ وتتغيّر بتغيّر الجاذبية.' },
    { id: 'b7', type: 'ARABIC_FORMULA', caption: 'التسارع من القوة والكتلة', lhs: 'ت', rhs: 'ق ÷ ك', legend: [] },
    { id: 'b7b', type: 'GIF_PLACEHOLDER', caption: 'تأثير القوة على التسارع', description: 'كلما ضاعفت القوة على نفس الكتلة، تضاعف التسارع.', color: '#4A90D9' },
    { id: 'b8', type: 'TIP', content: 'طبّق القانون على كل محور بشكل مستقل في المسائل ثنائية الأبعاد.' },
  ],
};

export const DEMO_LESSON_HISTORY = {
  subjectName:    'التاريخ',
  subjectKey:     'history',
  unitName:       'الوحدة الثالثة: السودان في القرن التاسع عشر',
  lessonTitle:    'الثورة المهدية',
  totalSections:  6,
  currentSection: 2,
  hook: 'كيف استطاع رجل من دنقلا بجيش لا يتجاوز بضعة آلاف أن يُسقط أعتى جيوش عصره ويؤسّس دولة مستقلة؟',
  orientation: {
    icon: '📜',
    points: [
      'نشأة الثورة المهدية وزعيمها محمد أحمد عبدالله',
      'التسلسل الزمني للأحداث الكبرى من ١٨٨١ إلى ١٨٩٨',
      'الأسباب الاقتصادية والدينية التي أشعلت الثورة',
      'الفرق الجوهري بين الثورة المهدية وثورة عرابي',
    ],
    estimatedMins: 6,
  },
  checkpoint: {
    question:     'في أي مكان أعلن محمد أحمد المهدي ثورته عام ١٨٨١؟',
    options:      ['الخرطوم', 'الأبيض', 'جزيرة أبا', 'أم درمان'],
    correctIndex: 2,
    explanation:  'أعلن المهدي ثورته من جزيرة أبا على النيل الأبيض — ليس الخرطوم (سقطت لاحقاً ١٨٨٥).',
  },
  complete: {
    xpGained:    50,
    streakBefore: 7,
    forwardPull: 'درس الحكم الثنائي البريطاني المصري ينتظرك — اكتمل الصورة التاريخية! 🎯',
  },
  blocks: [
    { id: 'h1', type: 'HEADING', level: 2, content: 'الثورة المهدية (١٨٨١ – ١٨٩٨)' },
    { id: 'h2', type: 'TEXT', content: 'قامت الثورة المهدية ضد الحكم التركي المصري في السودان، وكانت حركةً دينيةً وسياسيةً في آنٍ واحد، جمعت القبائل السودانية تحت راية واحدة ونجحت في تأسيس دولة مستقلة.' },
    { id: 'h3', type: 'HIGHLIGHT_BOX', style: 'DEFINITION', title: 'من هو المهدي؟', content: 'محمد أحمد بن عبدالله (١٨٤٤–١٨٨٥)، وُلد في دنقلا. أعلن نفسه المهدي المنتظر عام ١٨٨١ من جزيرة أبا.' },
    { id: 'h3b', type: 'IMAGE_PLACEHOLDER', caption: 'جزيرة أبا — منشأ الثورة', description: 'جزيرة أبا على النيل الأبيض جنوب الخرطوم.', color: '#C0392B', icon: 'portrait' },
    { id: 'h4', type: 'TEXT', content: 'تتابعت انتصارات المهدي بسرعة مذهلة — سقوط الأبيض ١٨٨٣، ثم حصار الخرطوم الذي انتهى بمقتل الجنرال غردون باشا في يناير ١٨٨٥.' },
    { id: 'h4b', type: 'TABLE', caption: 'المراحل الزمنية الكبرى', headers: ['السنة', 'الحدث', 'النتيجة'], rows: [['١٨٨١', 'إعلان المهدية — جزيرة أبا', 'بداية التجمّع'], ['١٨٨٣', 'معركة شيكان', 'هزيمة هيكس باشا'], ['١٨٨٥', 'فتح الخرطوم', 'مقتل غردون'], ['١٨٩٨', 'معركة أم درمان', 'نهاية المهدية']] },
    { id: 'h5', type: 'EXAMPLE', caption: 'المراحل الزمنية — تفاعلي', interactive: true, steps: ['١٨٨١ — إعلان المهدية في جزيرة أبا والبدء بتجميع الأنصار.', '١٨٨٣ — معركة شيكان: هزيمة الجيش المصري بقيادة هيكس باشا.', '١٨٨٥ — فتح الخرطوم وسقوط غردون. وفاة المهدي بعد أشهر.', '١٨٩٨ — معركة أم درمان: هزيمة الدولة المهدية أمام القوات البريطانية.'] },
    { id: 'h6', type: 'HIGHLIGHT_BOX', style: 'WARNING', title: 'لا تخلط', content: 'الثورة المهدية (١٨٨١–١٨٩٨) تختلف عن ثورة عرابي (١٨٧٩–١٨٨٢).' },
    { id: 'h7', type: 'TEXT', content: 'أسفر انتصار كيتشنر عن بدء الحكم الثنائي (الإنجليزي المصري) للسودان رسمياً عام ١٨٩٩.' },
    { id: 'h8', type: 'TIP', content: 'في الامتحانات: ركّز على التسلسل الزمني والأسباب المباشرة وغير المباشرة.' },
  ],
};

export const DEMO_LESSON = DEMO_LESSON_PHYSICS;
export const LESSON_BY_PATH = {
  SCIENCE:  DEMO_LESSON_PHYSICS,
  LITERARY: DEMO_LESSON_HISTORY,
};

// ─────────────────────────────────────────────────────────────────────────────
// FEED CARDS
//
// Pattern per session:
//   3 info cards (FACT / DEFINITION / TIP / FLASH_CARD) → subject A
//   1 MCQ question                                       → subject A
//   1 REVIEW card (breaks the pattern — can appear anywhere)
//   3 info cards                                         → subject B (switched)
//   1 TRUE_FALSE question                                → subject B
//   SESSION_END                                          → end-of-session screen
// ─────────────────────────────────────────────────────────────────────────────

const FEED_CARDS_SCIENCE = [
  // ── Block 1: Physics (3 info) ─────────────────────────────────────────────
  {
    id: 'f1',
    type: 'FACT',
    subjectName: 'الفيزياء',
    subjectKey: 'physics',
    typeLabel: 'حقيقة فيزيائية',
    contentAr: 'الضوء يقطع المسافة بين الشمس والأرض (١٥٠ مليون كيلومتر) في ٨ دقائق و٢٠ ثانية فقط — هذا يعني أنك ترى الشمس دائماً كما كانت قبل ٨ دقائق.',
  },
  {
    id: 'f2',
    type: 'FLASH_CARD',
    subjectName: 'الفيزياء',
    subjectKey: 'physics',
    typeLabel: 'بطاقة تذكير',
    contentAr: 'ما هي العلاقة بين القوة والتسارع عند ثبات الكتلة؟',
    back: 'القوة والتسارع متناسبان طردياً — إذا ضاعفت القوة ضاعف التسارع. هذا هو جوهر القانون الثاني لنيوتن: ق = ك × ت',
  },
  {
    id: 'f3',
    type: 'FACT',
    subjectName: 'الفيزياء',
    subjectKey: 'physics',
    typeLabel: 'حقيقة فيزيائية',
    contentAr: 'في الفضاء، ريشة وحجر يسقطان بنفس السرعة تماماً — لأنه لا يوجد هواء. أثبت غاليليو هذا قبل أن يصف نيوتن السبب رياضياً.',
  },

  // ── MCQ: Physics ──────────────────────────────────────────────────────────
  {
    id: 'f4',
    type: 'MCQ',
    subjectName: 'الفيزياء',
    subjectKey: 'physics',
    typeLabel: 'سؤال',
    contentAr: 'جسم كتلته ٥ كيلوغرام تؤثر عليه قوة محصّلة ٢٠ نيوتن. ما مقدار تسارعه؟',
    options: ['٢ م/ث²', '٤ م/ث²', '١٠٠ م/ث²', '٢٥ م/ث²'],
    correctIndex: 1,
    explanation: 'من القانون الثاني: ت = ق ÷ ك = ٢٠ ÷ ٥ = ٤ م/ث². الخيار الثالث ناتج عن الضرب بدل القسمة.',
    xpReward: 10,
  },

  // ── REVIEW card (pattern-breaker) ─────────────────────────────────────────
  {
    id: 'f4b',
    type: 'REVIEW',
    subjectName: 'الفيزياء',
    subjectKey: 'physics',
    typeLabel: 'مراجعة سريعة',
    contentAr: 'المعادلة الأساسية: ق = ك × ت',
    reviewPoints: [
      'ق = القوة بالنيوتن',
      'ك = الكتلة بالكيلوغرام',
      'ت = التسارع م/ث²',
      'القوة والتسارع متناسبان طردياً عند ثبات الكتلة',
    ],
  },

  // ── Block 2: Biology (3 info — subject switch) ────────────────────────────
  {
    id: 'f5',
    type: 'FACT',
    subjectName: 'الأحياء',
    subjectKey: 'biology',
    typeLabel: 'حقيقة علمية',
    contentAr: 'DNA خلية واحدة، لو مُدّد، يبلغ طوله أكثر من مترين. في جسمك ٣٧ تريليون خلية — أي ما يكفي للوصول من الأرض إلى الشمس ذهاباً وإياباً.',
  },
  {
    id: 'f6',
    type: 'DEFINITION',
    subjectName: 'الأحياء',
    subjectKey: 'biology',
    typeLabel: 'مفهوم',
    contentAr: 'الميتوكوندريا: عضية خلوية تُنتج الطاقة (ATP) عبر التنفس الخلوي. تُسمى «مولّد طاقة الخلية» لأنها المحرك الرئيسي لكل العمليات الحيوية.',
  },
  {
    id: 'f7',
    type: 'FLASH_CARD',
    subjectName: 'الأحياء',
    subjectKey: 'biology',
    typeLabel: 'بطاقة تذكير',
    contentAr: 'ما هي وظيفة الريبوسوم داخل الخلية؟',
    back: 'تخليق البروتينات — يقرأ الريبوسوم الرسائل الجينية (mRNA) ويُجمّع الأحماض الأمينية لبناء البروتين المطلوب.',
  },

  // ── TRUE_FALSE: Biology ───────────────────────────────────────────────────
  {
    id: 'f8',
    type: 'TRUE_FALSE',
    subjectName: 'الأحياء',
    subjectKey: 'biology',
    typeLabel: 'صح أم خطأ',
    contentAr: 'الميتوكوندريا والبلاستيدات الخضراء تمتلكان DNA خاصاً بهما مستقلاً عن نواة الخلية.',
    correctAnswer: 'true',
    explanation: 'صحيح! كلاهما يمتلك DNA حلقي مشابه للبكتيريا، مما يدعم نظرية الطفيل الداخلي — أنهما كانا في الأصل بكتيريا مستقلة.',
    xpReward: 10,
  },

  // ── SESSION END ───────────────────────────────────────────────────────────
  {
    id: 'f_end',
    type: 'SESSION_END',
    xpEarned: 85,
    cardsCompleted: 8,
    subjectsHit: ['الفيزياء', 'الأحياء'],
  },
];

const FEED_CARDS_LITERARY = [
  // ── Block 1: History (3 info) ─────────────────────────────────────────────
  {
    id: 'fl1',
    type: 'FACT',
    subjectName: 'التاريخ',
    subjectKey: 'history',
    typeLabel: 'حقيقة تاريخية',
    contentAr: 'مدينة مروي في السودان كانت عاصمة مملكة كوش لأكثر من ألف سنة، ومركزاً للصناعة الحديدية أثّر في تجارة أفريقيا بأسرها.',
  },
  {
    id: 'fl2',
    type: 'FLASH_CARD',
    subjectName: 'التاريخ',
    subjectKey: 'history',
    typeLabel: 'بطاقة تذكير',
    contentAr: 'متى وأين أعلن محمد أحمد المهدي ثورته؟',
    back: 'أعلن ثورته عام ١٨٨١ من جزيرة أبا على النيل الأبيض — وليس من الخرطوم كما يُظن خطأً.',
  },
  {
    id: 'fl3',
    type: 'FACT',
    subjectName: 'التاريخ',
    subjectKey: 'history',
    typeLabel: 'حقيقة تاريخية',
    contentAr: 'السودان يمتلك أكبر عدد من الأهرامات في العالم — أكثر من مصر بثلاثة أضعاف — معظمها في منطقة البجراوية ومروي.',
  },

  // ── MCQ: History ──────────────────────────────────────────────────────────
  {
    id: 'fl4',
    type: 'MCQ',
    subjectName: 'التاريخ',
    subjectKey: 'history',
    typeLabel: 'سؤال',
    contentAr: 'في أي عام سقطت الخرطوم وقُتل الجنرال غردون باشا؟',
    options: ['١٨٨١', '١٨٨٣', '١٨٨٥', '١٨٩٨'],
    correctIndex: 2,
    explanation: 'سقطت الخرطوم عام ١٨٨٥ وقُتل غردون باشا. عام ١٨٨١ كان إعلان الثورة، و١٨٨٣ معركة شيكان، و١٨٩٨ معركة أم درمان.',
    xpReward: 10,
  },

  // ── REVIEW card ───────────────────────────────────────────────────────────
  {
    id: 'fl4b',
    type: 'REVIEW',
    subjectName: 'التاريخ',
    subjectKey: 'history',
    typeLabel: 'مراجعة سريعة',
    contentAr: 'أبرز محطات الثورة المهدية',
    reviewPoints: [
      '١٨٨١ — إعلان المهدية من جزيرة أبا',
      '١٨٨٣ — هزيمة هيكس باشا في شيكان',
      '١٨٨٥ — سقوط الخرطوم ومقتل غردون',
      '١٨٩٨ — هزيمة أم درمان ونهاية المهدية',
    ],
  },

  // ── Block 2: Arabic (3 info — subject switch) ─────────────────────────────
  {
    id: 'fl5',
    type: 'DEFINITION',
    subjectName: 'اللغة العربية',
    subjectKey: 'arabic',
    typeLabel: 'مفهوم أدبي',
    contentAr: 'الفصاحة في اللغة العربية ثلاثة أنواع: فصاحة الكلمة، وفصاحة الكلام، وفصاحة المتكلم — ولكل نوع معاييره الخاصة التي درسها البلاغيون.',
  },
  {
    id: 'fl6',
    type: 'FACT',
    subjectName: 'اللغة العربية',
    subjectKey: 'arabic',
    typeLabel: 'حقيقة لغوية',
    contentAr: 'اللغة العربية تمتلك أكثر من ١٢ مليون كلمة في معجماتها، مما يجعلها من أغنى اللغات في العالم من حيث المفردات.',
  },
  {
    id: 'fl7',
    type: 'FLASH_CARD',
    subjectName: 'اللغة العربية',
    subjectKey: 'arabic',
    typeLabel: 'بطاقة تذكير',
    contentAr: 'ما الفرق بين الاستعارة والتشبيه؟',
    back: 'التشبيه يذكر المشبّه والمشبّه به مع أداة تشبيه (كـ، مثل). الاستعارة تحذف أحد طرفيه — فتقول «رأيت أسداً يخطب» بدل «خطيب كالأسد».',
  },

  // ── TRUE_FALSE: Arabic ────────────────────────────────────────────────────
  {
    id: 'fl8',
    type: 'TRUE_FALSE',
    subjectName: 'اللغة العربية',
    subjectKey: 'arabic',
    typeLabel: 'صح أم خطأ',
    contentAr: 'الكناية نوع من المجاز اللغوي، وتعني التعبير عن معنى بلفظ آخر يدل عليه.',
    correctAnswer: 'true',
    explanation: 'صحيح — الكناية تعبير غير مباشر حيث يُذكر اللفظ ويُراد به لازم معناه. مثال: «فلان طويل النجاد» كناية عن طول القامة.',
    xpReward: 10,
  },

  // ── SESSION END ───────────────────────────────────────────────────────────
  {
    id: 'fl_end',
    type: 'SESSION_END',
    xpEarned: 80,
    cardsCompleted: 8,
    subjectsHit: ['التاريخ', 'اللغة العربية'],
  },
];

export const FEED_CARDS_BY_PATH = {
  SCIENCE:  FEED_CARDS_SCIENCE,
  LITERARY: FEED_CARDS_LITERARY,
};

export const DEMO_FEED_CARDS = FEED_CARDS_SCIENCE;

export const DEMO_PROFILE = {
  nameAr:        'يوسف أحمد',
  roleAr:        'طالب — الثانوي العام',
  joinedAr:      'منذ ٣ أسابيع',
  avatarInitial: 'ي',
  stats: [
    { label: 'الدروس المكتملة',   value: '١٢' },
    { label: 'اللقطات المشاهدة',  value: '٨٤' },
    { label: 'سلسلة المذاكرة',    value: '٧ أيام' },
    { label: 'النقاط المكتسبة',   value: '١٢٤٠' },
  ],
  activityWeek: [3, 5, 2, 6, 4, 7, 3],
};