// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA — Single source of truth for all demo content.
// Edit this file only to change what the demo shows.
// ─────────────────────────────────────────────────────────────────────────────

// Subject accent colors — mirrors Basheer's MainColors.subjectColorByName()
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

// ─────────────────────────────────────────────────────────────────────────────
// USER — overridden at runtime by onboarding data
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_USER = {
  nameAr:         'يوسف',
  streak:         7,
  xp:             1240,
  xpToNext:       2000,
  dailyGoalDone:  2,
  dailyGoalTotal: 5,
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECTS BY PATH
// ─────────────────────────────────────────────────────────────────────────────
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

// Backward-compat alias
export const DEMO_SUBJECTS = SUBJECTS_BY_PATH.SCIENCE;

// ─────────────────────────────────────────────────────────────────────────────
// HOME SCREEN FOCUS CARD — by path
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// LESSON — PHYSICS (علمي)
// Arabic-notation formulas: ق = قوة (F), ك = كتلة (m), ت = تسارع (a)
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_LESSON_PHYSICS = {
  subjectName:    'الفيزياء',
  subjectKey:     'physics',
  unitName:       'الوحدة الثانية: الحركة والقوى',
  lessonTitle:    'القانون الثاني لنيوتن',
  totalSections:  8,
  currentSection: 3,
  blocks: [
    {
      id: 'b1',
      type: 'HEADING',
      level: 2,
      content: 'القانون الثاني لنيوتن',
    },
    {
      id: 'b2',
      type: 'TEXT',
      content:
        'ينص القانون الثاني على أن القوة المحصّلة تساوي حاصل ضرب الكتلة في التسارع. كلّما زادت كتلة الجسم، احتجت إلى قوة أكبر لتُحدث نفس التسارع.',
    },
    {
      id: 'b3',
      type: 'HIGHLIGHT_BOX',
      style: 'DEFINITION',
      title: 'تعريف',
      content:
        'القوة المحصّلة: محصّلة جميع القوى المؤثرة على جسم ما. وحدتها النيوتن، وهي كمية متجهة لها مقدار واتجاه.',
    },
    {
      id: 'b4',
      type: 'ARABIC_FORMULA',
      caption: 'المعادلة الأساسية',
      lhs: 'ق',
      rhs: 'ك × ت',
      legend: [
        { sym: 'ق', meaning: 'القوة (نيوتن)' },
        { sym: 'ك', meaning: 'الكتلة (كيلوغرام)' },
        { sym: 'ت', meaning: 'التسارع (م/ث²)' },
      ],
    },
    {
      id: 'b5',
      type: 'EXAMPLE',
      caption: 'مثال — خطوة بخطوة',
      interactive: true,
      steps: [
        'جسم كتلته ٤ كيلوغرام يتسارع بمقدار ٣ م/ث². أوجد القوة.',
        'نطبّق المعادلة: ق = ك × ت',
        'نعوّض: ق = ٤ × ٣',
        'الناتج: ق = ١٢ نيوتن ✓',
      ],
    },
    {
      id: 'b6',
      type: 'HIGHLIGHT_BOX',
      style: 'WARNING',
      title: 'تنبيه',
      content:
        'لا تخلط بين الكتلة والوزن. الكتلة ثابتة بالكيلوغرام، أما الوزن فقوة تساوي ك × جـ وتتغيّر بتغيّر الجاذبية.',
    },
    {
      id: 'b7',
      type: 'ARABIC_FORMULA',
      caption: 'التسارع من القوة والكتلة',
      lhs: 'ت',
      rhs: 'ق ÷ ك',
      legend: [],
    },
    {
      id: 'b8',
      type: 'TIP',
      content:
        'طبّق القانون على كل محور بشكل مستقل في المسائل ثنائية الأبعاد — المحور الأفقي والمحور الرأسي كل على حدة.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LESSON — HISTORY (أدبي)  الثورة المهدية
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_LESSON_HISTORY = {
  subjectName:    'التاريخ',
  subjectKey:     'history',
  unitName:       'الوحدة الثالثة: السودان في القرن التاسع عشر',
  lessonTitle:    'الثورة المهدية',
  totalSections:  6,
  currentSection: 2,
  blocks: [
    {
      id: 'h1',
      type: 'HEADING',
      level: 2,
      content: 'الثورة المهدية (١٨٨١ – ١٨٩٨)',
    },
    {
      id: 'h2',
      type: 'TEXT',
      content:
        'قامت الثورة المهدية ضد الحكم التركي المصري في السودان، وكانت حركةً دينيةً وسياسيةً في آنٍ واحد، جمعت القبائل السودانية تحت راية واحدة ونجحت في تأسيس دولة مستقلة.',
    },
    {
      id: 'h3',
      type: 'HIGHLIGHT_BOX',
      style: 'DEFINITION',
      title: 'من هو المهدي؟',
      content:
        'محمد أحمد بن عبدالله (١٨٤٤–١٨٨٥)، وُلد في دنقلا. أعلن نفسه المهدي المنتظر عام ١٨٨١ من جزيرة أبا، وبدأ ثورته بقوة لا تتجاوز بضعة آلاف من الأنصار.',
    },
    {
      id: 'h4',
      type: 'TEXT',
      content:
        'تتابعت انتصارات المهدي بسرعة مذهلة — سقوط الأبيض ١٨٨٣، ثم حصار الخرطوم الذي انتهى بمقتل الجنرال غردون باشا في يناير ١٨٨٥.',
    },
    {
      id: 'h5',
      type: 'EXAMPLE',
      caption: 'المراحل الزمنية',
      interactive: true,
      steps: [
        '١٨٨١ — إعلان المهدية في جزيرة أبا والبدء بتجميع الأنصار.',
        '١٨٨٣ — معركة شيكان: هزيمة الجيش المصري بقيادة هيكس باشا.',
        '١٨٨٥ — فتح الخرطوم وسقوط غردون. وفاة المهدي بعد شهور، خلفه الخليفة عبدالله.',
        '١٨٩٨ — معركة أم درمان: هزيمة الدولة المهدية أمام القوات البريطانية بقيادة كيتشنر.',
      ],
    },
    {
      id: 'h6',
      type: 'HIGHLIGHT_BOX',
      style: 'WARNING',
      title: 'لا تخلط',
      content:
        'الثورة المهدية (١٨٨١–١٨٩٨) تختلف عن ثورة عرابي (١٨٧٩–١٨٨٢) — هذه في مصر ضد التدخل الأجنبي، وتلك في السودان ضد الحكم التركي المصري مباشرةً.',
    },
    {
      id: 'h7',
      type: 'TEXT',
      content:
        'أسفر انتصار كيتشنر عن بدء الحكم الثنائي (الإنجليزي المصري) للسودان رسمياً عام ١٨٩٩، مرحلة جديدة في تاريخ البلاد ستمتد حتى الاستقلال ١٩٥٦.',
    },
    {
      id: 'h8',
      type: 'TIP',
      content:
        'في الامتحانات: ركّز على التسلسل الزمني للأحداث والأسباب المباشرة وغير المباشرة للثورة. الأسباب الاقتصادية (الضرائب المرهقة) غالباً ما تُسأل جنباً إلى جنب مع الدينية.',
    },
  ],
};

// Backward-compat alias
export const DEMO_LESSON = DEMO_LESSON_PHYSICS;

// Map path → lesson
export const LESSON_BY_PATH = {
  SCIENCE:  DEMO_LESSON_PHYSICS,
  LITERARY: DEMO_LESSON_HISTORY,
};

// ─────────────────────────────────────────────────────────────────────────────
// FEED CARDS — TikTok order: 4 lesson bites → 1 T/F → 1 flip card
// ─────────────────────────────────────────────────────────────────────────────
const FEED_CARDS_SCIENCE = [
  {
    id: 'f1',
    type: 'FACT',
    subjectName: 'الفيزياء',
    subjectKey: 'physics',
    typeLabel: 'حقيقة فيزيائية',
    contentAr:
      'الضوء يقطع المسافة بين الشمس والأرض (١٥٠ مليون كيلومتر) في ٨ دقائق و٢٠ ثانية فقط — هذا يعني أنك ترى الشمس دائماً كما كانت قبل ٨ دقائق.',
  },
  {
    id: 'f2',
    type: 'DEFINITION',
    subjectName: 'الرياضيات',
    subjectKey: 'math',
    typeLabel: 'معلومة رياضية',
    contentAr:
      'عدد π يظهر في معادلات الموجات والاحتمالات وتوزيع الأعداد الأولية — ليس فقط في دوائر الهندسة. الرياضيات أعمق مما يبدو.',
  },
  {
    id: 'f3',
    type: 'FACT',
    subjectName: 'الأحياء',
    subjectKey: 'biology',
    typeLabel: 'حقيقة علمية',
    contentAr:
      'DNA خلية واحدة، لو مُدّد، يبلغ طوله أكثر من مترين. في جسمك ٣٧ تريليون خلية — أي ما يكفي للوصول من الأرض إلى الشمس ذهاباً وإياباً.',
  },
  {
    id: 'f4',
    type: 'TIP',
    subjectName: 'الفيزياء',
    subjectKey: 'physics',
    typeLabel: 'نصيحة دراسية',
    contentAr:
      'قبل حل أي مسألة ميكانيكا، ارسم مخطط الجسم الحر أولاً — كل القوى على سهم. هذه الخطوة تقلّل أخطاء الإشارة بشكل كبير.',
  },
  {
    id: 'f5',
    type: 'TRUE_FALSE',
    subjectName: 'الفيزياء',
    subjectKey: 'physics',
    typeLabel: 'صح أم خطأ',
    contentAr: 'الكتلة والوزن كميتان متساويتان تُقاسان بنفس الوحدة.',
    correctAnswer: 'false',
    explanation: 'الكتلة تُقاس بالكيلوغرام وهي ثابتة، أما الوزن فقوة تُقاس بالنيوتن وتتغيّر بتغيّر الجاذبية.',
  },
  {
    id: 'f6',
    type: 'FLASH_CARD',
    subjectName: 'الأحياء',
    subjectKey: 'biology',
    typeLabel: 'بطاقة تذكير',
    contentAr: 'ما هي وظيفة الميتوكوندريا؟',
    back: 'إنتاج الطاقة (ATP) عبر التنفس الخلوي. تُسمّى «مولّد طاقة الخلية» لأنها المحرك الرئيسي لكل العمليات الحيوية.',
  },
];

const FEED_CARDS_LITERARY = [
  {
    id: 'fl1',
    type: 'FACT',
    subjectName: 'التاريخ',
    subjectKey: 'history',
    typeLabel: 'حقيقة تاريخية',
    contentAr:
      'مدينة مروي في السودان كانت عاصمة مملكة كوش لأكثر من ألف سنة، ومركزاً للصناعة الحديدية أثّر في تجارة أفريقيا بأسرها.',
  },
  {
    id: 'fl2',
    type: 'DEFINITION',
    subjectName: 'اللغة العربية',
    subjectKey: 'arabic',
    typeLabel: 'مفهوم أدبي',
    contentAr:
      'الفصاحة في اللغة العربية ثلاثة أنواع: فصاحة الكلمة، وفصاحة الكلام، وفصاحة المتكلم — ولكل نوع معاييره الخاصة التي درسها البلاغيون.',
  },
  {
    id: 'fl3',
    type: 'FACT',
    subjectName: 'الجغرافيا',
    subjectKey: 'geography',
    typeLabel: 'حقيقة جغرافية',
    contentAr:
      'السودان يمتلك أكبر عدد من الأهرامات في العالم — أكثر من مصر بثلاثة أضعاف — معظمها في منطقة البجراوية ومروي.',
  },
  {
    id: 'fl4',
    type: 'TIP',
    subjectName: 'التاريخ',
    subjectKey: 'history',
    typeLabel: 'نصيحة دراسية',
    contentAr:
      'في مادة التاريخ، ركّز على الأسباب والنتائج لكل حدث، وليس فقط التواريخ. ربط الأحداث بسياقها السياسي والاقتصادي يُسهّل الحفظ.',
  },
  {
    id: 'fl5',
    type: 'TRUE_FALSE',
    subjectName: 'التاريخ',
    subjectKey: 'history',
    typeLabel: 'صح أم خطأ',
    contentAr: 'أعلن محمد أحمد المهدي ثورته من مدينة الخرطوم عام ١٨٨١.',
    correctAnswer: 'false',
    explanation: 'أعلن المهدي ثورته من جزيرة أبا على النيل الأبيض، وليس من الخرطوم. الخرطوم سقطت لاحقاً عام ١٨٨٥.',
  },
  {
    id: 'fl6',
    type: 'FLASH_CARD',
    subjectName: 'التاريخ',
    subjectKey: 'history',
    typeLabel: 'بطاقة تذكير',
    contentAr: 'من خلف المهدي في قيادة الدولة المهدية بعد وفاته؟',
    back: 'الخليفة عبدالله التعايشي — قاد الدولة المهدية من ١٨٨٥ حتى هزيمتها في معركة أم درمان ١٨٩٨ على يد الجيش البريطاني بقيادة كيتشنر.',
  },
];

// Map path → feed cards
export const FEED_CARDS_BY_PATH = {
  SCIENCE:  FEED_CARDS_SCIENCE,
  LITERARY: FEED_CARDS_LITERARY,
};

// Backward-compat alias
export const DEMO_FEED_CARDS = FEED_CARDS_SCIENCE;

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE SCREEN — static base data (name overridden at runtime)
// ─────────────────────────────────────────────────────────────────────────────
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