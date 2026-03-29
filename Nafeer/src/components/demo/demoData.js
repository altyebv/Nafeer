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
// HOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_USER = {
  nameAr:        'يوسف',
  streak:        7,
  streakLevel:   'FLAME',   // FLAME | SPARK | COLD
  xp:            1240,
  xpToNext:      2000,
  dailyGoalDone: 2,
  dailyGoalTotal: 5,
};

export const DEMO_SUBJECTS = [
  { id: 's1', nameAr: 'الفيزياء',    key: 'physics',   initial: 'ف', progress: 35 },
  { id: 's2', nameAr: 'الرياضيات',   key: 'math',      initial: 'ر', progress: 52 },
  { id: 's3', nameAr: 'الأحياء',     key: 'biology',   initial: 'أح', progress: 18 },
  { id: 's4', nameAr: 'الكيمياء',    key: 'chemistry', initial: 'ك', progress: 40 },
];

// ─────────────────────────────────────────────────────────────────────────────
// LESSON SCREEN
// Arabic-notation formulas: ق = قوة (F), ك = كتلة (m), ت = تسارع (a)
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_LESSON = {
  subjectName:     'الفيزياء',
  subjectKey:      'physics',
  unitName:        'الوحدة الثانية: الحركة والقوى',
  lessonTitle:     'القانون الثاني لنيوتن',
  totalSections:   8,
  currentSection:  3,

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
      content: 'القوة المحصّلة: محصّلة جميع القوى المؤثرة على جسم ما. وحدتها النيوتن، وهي كمية متجهة لها مقدار واتجاه.',
    },
    {
      id: 'b4',
      type: 'ARABIC_FORMULA',
      caption: 'المعادلة الأساسية',
      // lhs / rhs rendered as large Arabic math text
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
      content: 'لا تخلط بين الكتلة والوزن. الكتلة ثابتة بالكيلوغرام، أما الوزن فقوة تساوي ك × جـ وتتغيّر بتغيّر الجاذبية.',
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
      content: 'طبّق القانون على كل محور بشكل مستقل في المسائل ثنائية الأبعاد — المحور الأفقي والمحور الرأسي كل على حدة.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// FEED CARDS — 4 definition/fact, 1 flip card, 1 T/F question
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_FEED_CARDS = [
  {
    id: 'f1',
    type: 'DEFINITION',
    subjectName: 'الرياضيات',
    subjectKey: 'math',
    typeLabel: 'معلومة رياضية',
    contentAr:
      'عدد π يظهر في صيغ الاحتمالات ومعادلات الموجات وتوزيع الأعداد الأولية — ليس فقط في دوائر الهندسة. الرياضيات أعمق مما يبدو.',
  },
  {
    id: 'f2',
    type: 'FACT',
    subjectName: 'الأحياء',
    subjectKey: 'biology',
    typeLabel: 'حقيقة علمية',
    contentAr:
      'DNA خلية واحدة، لو مُدّد، يبلغ طوله أكثر من مترين. وفي جسمك ٣٧ تريليون خلية — أي ما يكفي للوصول من الأرض إلى الشمس ذهاباً وإياباً.',
  },
  {
    id: 'f3',
    type: 'FACT',
    subjectName: 'التاريخ',
    subjectKey: 'history',
    typeLabel: 'حقيقة تاريخية',
    contentAr:
      'مدينة مروي في السودان كانت عاصمة مملكة كوش لأكثر من ألف سنة، ومركزاً للصناعة الحديدية أثّر في تجارة أفريقيا بأسرها.',
  },
  {
    id: 'f4',
    type: 'TIP',
    subjectName: 'الفيزياء',
    subjectKey: 'physics',
    typeLabel: 'نصيحة دراسية',
    contentAr:
      'قبل حل أي مسألة ميكانيكا، ارسم مخطط الجسم الحر أولاً — كل القوى على سهم واحد. هذه الخطوة تقلل أخطاء الإشارة بشكل كبير.',
  },
  {
    id: 'f5',
    type: 'FLASH_CARD',
    subjectName: 'الأحياء',
    subjectKey: 'biology',
    typeLabel: 'بطاقة تذكير',
    contentAr: 'ما هي وظيفة الميتوكوندريا؟',
    back: 'إنتاج الطاقة (ATP) عبر التنفس الخلوي. تُسمّى «مولّد طاقة الخلية» لأنها المحرك الرئيسي لكل العمليات الحيوية.',
  },
  {
    id: 'f6',
    type: 'TRUE_FALSE',
    subjectName: 'الفيزياء',
    subjectKey: 'physics',
    typeLabel: 'صح أم خطأ',
    contentAr: 'الكتلة والوزن كميتان متساويتان تُقاسان بنفس الوحدة.',
    correctAnswer: 'false',
    explanation: 'الكتلة تُقاس بالكيلوغرام وهي ثابتة، أما الوزن فقوة تُقاس بالنيوتن وتتغيّر بالجاذبية.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE SCREEN — static data
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
  activityWeek: [3, 5, 2, 6, 4, 7, 3], // items per day, Sun→Sat
};
