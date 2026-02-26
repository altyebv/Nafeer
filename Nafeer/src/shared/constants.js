// Block types for lesson content (matches Android BlockType enum)
export const BLOCK_TYPES = {
  TEXT: 'TEXT',
  HEADING: 'HEADING',
  IMAGE: 'IMAGE',
  GIF: 'GIF',
  FORMULA: 'FORMULA',
  HIGHLIGHT_BOX: 'HIGHLIGHT_BOX',
  EXAMPLE: 'EXAMPLE',
  TIP: 'TIP',
  LIST: 'LIST',
  TABLE: 'TABLE',
  QUOTE: 'QUOTE',
  DIVIDER: 'DIVIDER',
};

export const BLOCK_TYPE_CONFIG = {
  TEXT:          { label: 'نص',           icon: '¶',  color: 'gray' },
  HEADING:       { label: 'عنوان',         icon: 'H',  color: 'blue' },
  IMAGE:         { label: 'صورة',          icon: '⬜', color: 'green' },
  GIF:           { label: 'صورة متحركة',   icon: '▷',  color: 'purple' },
  FORMULA:       { label: 'معادلة',        icon: '∑',  color: 'orange' },
  HIGHLIGHT_BOX: { label: 'مربع مهم',      icon: '!',  color: 'yellow' },
  EXAMPLE:       { label: 'مثال',          icon: '✎',  color: 'teal' },
  TIP:           { label: 'نصيحة',         icon: '◈',  color: 'pink' },
  LIST:          { label: 'قائمة',         icon: '≡',  color: 'indigo' },
  TABLE:         { label: 'جدول',          icon: '⊞',  color: 'cyan' },
  QUOTE:         { label: 'اقتباس',        icon: '❝',  color: 'slate' },
  DIVIDER:       { label: 'فاصل',          icon: '—',  color: 'stone' },
};

// Concept types (matches Android ConceptType enum)
export const CONCEPT_TYPES = {
  DEFINITION:   'DEFINITION',
  FORMULA:      'FORMULA',
  DATE:         'DATE',
  PERSON:       'PERSON',
  LAW:          'LAW',
  FACT:         'FACT',
  PROCESS:      'PROCESS',
  COMPARISON:   'COMPARISON',
  PLACE:        'PLACE',
  CAUSE_EFFECT: 'CAUSE_EFFECT',
};

export const CONCEPT_TYPE_CONFIG = {
  DEFINITION:   { label: 'تعريف',        icon: '📖' },
  FORMULA:      { label: 'معادلة',       icon: '📐' },
  DATE:         { label: 'تاريخ',        icon: '📅' },
  PERSON:       { label: 'شخصية',        icon: '👤' },
  LAW:          { label: 'قانون/مبدأ',   icon: '⚖️' },
  FACT:         { label: 'حقيقة',        icon: '✓'  },
  PROCESS:      { label: 'عملية/خطوات',  icon: '🔄' },
  COMPARISON:   { label: 'مقارنة',       icon: '⚖️' },
  PLACE:        { label: 'مكان',         icon: '📍' },
  CAUSE_EFFECT: { label: 'سبب ونتيجة',   icon: '🔗' },
};

// Student paths (matches Android StudentPath enum)
export const STUDENT_PATHS = {
  SCIENCE:  'SCIENCE',
  LITERARY: 'LITERARY',
  COMMON:   'COMMON',
};

export const PATH_CONFIG = {
  SCIENCE:  { label: 'علمي',    color: 'text-blue-400' },
  LITERARY: { label: 'أدبي',    color: 'text-purple-400' },
  COMMON:   { label: 'مشترك',   color: 'text-sand-400' },
};

// Feed item types (matches Android FeedItemType enum)
export const FEED_ITEM_TYPES = {
  DEFINITION: 'DEFINITION',
  FORMULA:    'FORMULA',
  DATE:       'DATE',
  FACT:       'FACT',
  RULE:       'RULE',
  TIP:        'TIP',
  MINI_QUIZ:  'MINI_QUIZ',
  FLASH_CARD: 'FLASH_CARD',  // NEW: flip card with front/back
};

export const FEED_ITEM_TYPE_CONFIG = {
  DEFINITION: { label: 'تعريف',      icon: '📖', color: 'blue'   },
  FORMULA:    { label: 'معادلة',     icon: '📐', color: 'purple' },
  DATE:       { label: 'تاريخ',      icon: '📅', color: 'orange' },
  FACT:       { label: 'حقيقة',      icon: '✓',  color: 'green'  },
  RULE:       { label: 'قاعدة',      icon: '📏', color: 'indigo' },
  TIP:        { label: 'نصيحة',      icon: '💡', color: 'yellow' },
  MINI_QUIZ:  { label: 'سؤال سريع',  icon: '🎯', color: 'red'    },
  FLASH_CARD: { label: 'بطاقة تذكر', icon: '🃏', color: 'teal'   },
};

// Interaction types for feed items (matches Android InteractionType enum)
export const INTERACTION_TYPES = {
  TAP_CONFIRM: 'TAP_CONFIRM',
  SWIPE_TF:    'SWIPE_TF',
  MCQ:         'MCQ',
  MATCH:       'MATCH',
};

export const INTERACTION_TYPE_CONFIG = {
  TAP_CONFIRM: { label: 'اضغط للتأكيد',     icon: '👆' },
  SWIPE_TF:    { label: 'اسحب صح/خطأ',      icon: '↔'  },
  MCQ:         { label: 'اختيار من متعدد',   icon: '◉'  },
  MATCH:       { label: 'وصّل',              icon: '⟷'  },
};

// Learning types for sections (matches Android LearningType enum)
export const LEARNING_TYPES = {
  UNDERSTANDING: 'UNDERSTANDING',
  MEMORIZATION:  'MEMORIZATION',
  HYBRID:        'HYBRID',
};

export const LEARNING_TYPE_CONFIG = {
  UNDERSTANDING: { label: 'فهم',         icon: '🧠', hint: 'يُفعّل المختبر والتدريب' },
  MEMORIZATION:  { label: 'حفظ',         icon: '💾', hint: 'يُضاف تلقائياً للتغذية' },
  HYBRID:        { label: 'فهم + حفظ',   icon: '⚡', hint: 'يُفعّل كلاهما' },
};

// Question types (matches Android QuestionType enum)
export const QUESTION_TYPES = {
  TRUE_FALSE:    'TRUE_FALSE',
  MCQ:           'MCQ',
  FILL_BLANK:    'FILL_BLANK',
  MATCH:         'MATCH',
  SHORT_ANSWER:  'SHORT_ANSWER',
  EXPLAIN:       'EXPLAIN',
  LIST:          'LIST',
  TABLE:         'TABLE',
  FIGURE:        'FIGURE',
  COMPARE:       'COMPARE',
  ORDER:         'ORDER',
};

export const QUESTION_TYPE_CONFIG = {
  TRUE_FALSE:   { label: 'صح أو خطأ',          icon: '✓✗',  feedEligible: true  },
  MCQ:          { label: 'اختيار من متعدد',      icon: '◉',   feedEligible: true  },
  FILL_BLANK:   { label: 'أكمل الفراغ',          icon: '___', feedEligible: false },
  MATCH:        { label: 'وصّل',                 icon: '⟷',   feedEligible: false },
  SHORT_ANSWER: { label: 'إجابة قصيرة',          icon: '✏️',  feedEligible: false },
  EXPLAIN:      { label: 'اشرح / علل',           icon: '💬',  feedEligible: false },
  LIST:         { label: 'اذكر',                 icon: '≡',   feedEligible: false },
  TABLE:        { label: 'جدول',                 icon: '⊞',   feedEligible: false },
  FIGURE:       { label: 'من الشكل',             icon: '🖼️',  feedEligible: false },
  COMPARE:      { label: 'قارن',                 icon: '⚖️',  feedEligible: false },
  ORDER:        { label: 'رتب',                  icon: '🔢',  feedEligible: false },
};

// Question source (matches Android QuestionSource enum)
export const QUESTION_SOURCES = {
  MINISTRY_FINAL:   'MINISTRY_FINAL',
  MINISTRY_SEMIFINAL: 'MINISTRY_SEMIFINAL',
  SCHOOL_EXAM:      'SCHOOL_EXAM',
  REVISION_SHEET:   'REVISION_SHEET',
  TEACHER_CONTRIB:  'TEACHER_CONTRIB',
  ORIGINAL:         'ORIGINAL',
};

export const QUESTION_SOURCE_CONFIG = {
  MINISTRY_FINAL:    { label: 'وزارة - نهائي',      icon: '🏛️' },
  MINISTRY_SEMIFINAL:{ label: 'وزارة - نصف سنوي',   icon: '🏛️' },
  SCHOOL_EXAM:       { label: 'امتحان مدرسي',        icon: '🏫' },
  REVISION_SHEET:    { label: 'ورقة مراجعة',         icon: '📋' },
  TEACHER_CONTRIB:   { label: 'مساهمة معلم',         icon: '👨‍🏫' },
  ORIGINAL:          { label: 'أصلي (جديد)',          icon: '✨' },
};

// Cognitive levels (matches Android CognitiveLevel enum)
export const COGNITIVE_LEVELS = {
  RECALL:     'RECALL',
  UNDERSTAND: 'UNDERSTAND',
  APPLY:      'APPLY',
  ANALYZE:    'ANALYZE',
};

export const COGNITIVE_LEVEL_CONFIG = {
  RECALL:     { label: 'تذكر',    color: 'text-green-400'  },
  UNDERSTAND: { label: 'فهم',     color: 'text-blue-400'   },
  APPLY:      { label: 'تطبيق',   color: 'text-orange-400' },
  ANALYZE:    { label: 'تحليل',   color: 'text-purple-400' },
};

// Exam sources (matches Android ExamSource enum)
export const EXAM_SOURCES = {
  MINISTRY: 'MINISTRY',
  SCHOOL:   'SCHOOL',
  PRACTICE: 'PRACTICE',
  CUSTOM:   'CUSTOM',
};

export const EXAM_SOURCE_CONFIG = {
  MINISTRY: { label: 'وزارة التربية',    icon: '🏛️' },
  SCHOOL:   { label: 'امتحان مدرسي',     icon: '🏫' },
  PRACTICE: { label: 'امتحان تدريبي',    icon: '📝' },
  CUSTOM:   { label: 'مخصص',             icon: '⚙️' },
};

// Exam types (matches Android ExamType enum)
export const EXAM_TYPES = {
  MONTHLY:    'MONTHLY',
  SEMI_FINAL: 'SEMI_FINAL',
  FINAL:      'FINAL',
};

export const EXAM_TYPE_CONFIG = {
  MONTHLY:    { label: 'شهري',          color: 'text-blue-400'   },
  SEMI_FINAL: { label: 'نصف سنوي',      color: 'text-orange-400' },
  FINAL:      { label: 'نهائي',         color: 'text-red-400'    },
};
