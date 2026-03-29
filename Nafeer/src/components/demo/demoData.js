// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA
// All content is hardcoded here. To update lesson content or feed cards,
// edit this file only — the components are content-agnostic.
// ─────────────────────────────────────────────────────────────────────────────

// Subject accent colors, mirroring Basheer's MainColors.subjectColorByName()
export const SUBJECT_COLORS = {
  physics:   '#4A90D9',
  chemistry: '#E67E22',
  biology:   '#27AE60',
  math:      '#9B59B6',
  history:   '#C0392B',
  arabic:    '#16A085',
  islamic:   '#1ABC9C',
  geography: '#2980B9',
  english:   '#7F8C8D',
};

// ─────────────────────────────────────────────────────────────────────────────
// LESSON BLOCKS
// Mirrors Basheer's BlockUiModel types: TEXT, HEADING, HIGHLIGHT_BOX,
// FORMULA, EXAMPLE (interactive), TIP
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_LESSON = {
  subjectName: 'الفيزياء',
  unitName: 'الوحدة الثانية: الحركة والقوى',
  lessonTitle: 'القانون الثاني لنيوتن',
  subjectKey: 'physics',
  totalSections: 8,
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
        'ينص القانون الثاني لنيوتن على أن القوة المحصّلة المؤثرة على جسم تساوي حاصل ضرب كتلة ذلك الجسم في تسارعه. هذا القانون هو حجر الأساس في ميكانيكا نيوتن الكلاسيكية.',
    },
    {
      id: 'b3',
      type: 'HIGHLIGHT_BOX',
      style: 'DEFINITION',
      title: 'تعريف',
      content:
        'القوة المحصّلة: هي المحصّلة الشعاعية لجميع القوى المؤثرة على الجسم. وحدتها النيوتن (N)، وهي كمية متجهة لها مقدار واتجاه.',
    },
    {
      id: 'b4',
      type: 'FORMULA',
      caption: 'المعادلة الأساسية',
      content: 'F = m \\cdot a',
    },
    {
      id: 'b5',
      type: 'TEXT',
      content:
        'حيث F هي القوة المحصّلة بالنيوتن، و m هي الكتلة بالكيلوغرام، و a هو التسارع بالمتر في الثانية المربعة. كلّما زادت الكتلة، احتجت إلى قوة أكبر لإحداث نفس التسارع.',
    },
    {
      id: 'b6',
      type: 'EXAMPLE',
      caption: 'مثال محلول — خطوة بخطوة',
      interactive: true,
      steps: [
        'جسم كتلته 4 كيلوغرام يتسارع بمقدار 3 م/ث². أوجد القوة المؤثرة عليه.',
        'نطبّق المعادلة: F = m × a',
        'نعوّض القيم: F = 4 × 3',
        'إذن: F = 12 نيوتن',
      ],
    },
    {
      id: 'b7',
      type: 'TIP',
      content:
        'القانون الثاني يُطبَّق في كل اتجاه بشكل مستقل. في المسائل ثنائية الأبعاد، طبّق المعادلة على المحور الأفقي والمحور الرأسي كل على حدة.',
    },
    {
      id: 'b8',
      type: 'HIGHLIGHT_BOX',
      style: 'WARNING',
      title: 'تنبيه',
      content:
        'لا تخلط بين الكتلة والوزن. الكتلة ثابتة وتُقاس بالكيلوغرام، أما الوزن فهو قوة تساوي m × g وتتغير بتغير التسارع الجاذبي.',
    },
    {
      id: 'b9',
      type: 'FORMULA',
      caption: 'القانون في صورة التسارع',
      content: 'a = \\dfrac{F}{m}',
    },
    {
      id: 'b10',
      type: 'TEXT',
      content:
        'هذه الصيغة تكشف علاقة عكسية مهمة: إذا بقيت القوة ثابتة وازدادت الكتلة، تناقص التسارع. هذا ما يفسّر لماذا يصعب تحريك الأجسام الثقيلة بسرعة.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// FEED CARDS
// Mirrors Basheer's FeedCard types: DEFINITION, FACT, FLASH_CARD, RULE, TIP
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_FEED_CARDS = [
  {
    id: 'f1',
    type: 'DEFINITION',
    subjectName: 'الرياضيات',
    subjectKey: 'math',
    typeLabel: 'معلومة',
    contentAr:
      'عدد π ليس مجرد نسبة محيط الدائرة إلى قطرها — إنه يظهر في صيغ الاحتمالات، ومعادلات الموجات، وتوزيع الأعداد الأولية. الرياضيات مترابطة بشكل أعمق مما يبدو.',
  },
  {
    id: 'f2',
    type: 'FLASH_CARD',
    subjectName: 'الأحياء',
    subjectKey: 'biology',
    typeLabel: 'بطاقة تذكير',
    contentAr: 'ما هي وظيفة الميتوكوندريا في الخلية؟',
    back: 'إنتاج الطاقة (ATP) عبر عملية التنفس الخلوي. لهذا تُسمّى «مولّد طاقة الخلية».',
  },
  {
    id: 'f3',
    type: 'FACT',
    subjectName: 'التاريخ',
    subjectKey: 'history',
    typeLabel: 'حقيقة تاريخية',
    contentAr:
      'مدينة مروي القديمة في السودان كانت عاصمة مملكة كوش لأكثر من ألف سنة، وكانت مركزاً متقدماً لصناعة الحديد أثّر في تجارة القارة الأفريقية بأسرها.',
  },
  {
    id: 'f4',
    type: 'TIP',
    subjectName: 'الفيزياء',
    subjectKey: 'physics',
    typeLabel: 'نصيحة دراسية',
    contentAr:
      'قبل حل أي مسألة ميكانيكا، ارسم مخطط الجسم الحر (FBD) أولاً. رسم الجسم مع جميع القوى المؤثرة عليه يقلل أخطاء الإشارة بنسبة كبيرة.',
  },
  {
    id: 'f5',
    type: 'DEFINITION',
    subjectName: 'الكيمياء',
    subjectKey: 'chemistry',
    typeLabel: 'قاعدة',
    contentAr:
      'قاعدة الثمانية: الذرات تميل لاكتساب أو فقد أو مشاركة إلكترونات حتى يصبح في مستواها الخارجي ٨ إلكترونات، تحقيقاً للاستقرار.',
  },
];
