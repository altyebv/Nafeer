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
  TEXT: { label: 'نص', icon: '📝', color: 'gray' },
  HEADING: { label: 'عنوان', icon: '🔤', color: 'blue' },
  IMAGE: { label: 'صورة', icon: '🖼️', color: 'green' },
  GIF: { label: 'صورة متحركة', icon: '🎬', color: 'purple' },
  FORMULA: { label: 'معادلة', icon: '📐', color: 'orange' },
  HIGHLIGHT_BOX: { label: 'مربع مهم', icon: '💡', color: 'yellow' },
  EXAMPLE: { label: 'مثال', icon: '📋', color: 'teal' },
  TIP: { label: 'نصيحة', icon: '💭', color: 'pink' },
  LIST: { label: 'قائمة', icon: '📃', color: 'indigo' },
  TABLE: { label: 'جدول', icon: '📊', color: 'cyan' },
  QUOTE: { label: 'اقتباس', icon: '❝', color: 'slate' },
  DIVIDER: { label: 'فاصل', icon: '—', color: 'stone' },
};

// Concept types (matches Android ConceptType enum)
export const CONCEPT_TYPES = {
  DEFINITION: 'DEFINITION',
  FORMULA: 'FORMULA',
  DATE: 'DATE',
  PERSON: 'PERSON',
  LAW: 'LAW',
  FACT: 'FACT',
  PROCESS: 'PROCESS',
  COMPARISON: 'COMPARISON',
  PLACE: 'PLACE',
  CAUSE_EFFECT: 'CAUSE_EFFECT',
};

export const CONCEPT_TYPE_CONFIG = {
  DEFINITION: { label: 'تعريف', icon: '📖' },
  FORMULA: { label: 'معادلة', icon: '📐' },
  DATE: { label: 'تاريخ', icon: '📅' },
  PERSON: { label: 'شخصية', icon: '👤' },
  LAW: { label: 'قانون/مبدأ', icon: '⚖️' },
  FACT: { label: 'حقيقة', icon: '✓' },
  PROCESS: { label: 'عملية/خطوات', icon: '🔄' },
  COMPARISON: { label: 'مقارنة', icon: '⚖️' },
  PLACE: { label: 'مكان', icon: '📍' },
  CAUSE_EFFECT: { label: 'سبب ونتيجة', icon: '🔗' },
};

// Student paths (matches Android StudentPath enum)
export const STUDENT_PATHS = {
  SCIENCE: 'SCIENCE',
  LITERARY: 'LITERARY',
  COMMON: 'COMMON',
};

export const PATH_CONFIG = {
  SCIENCE: { label: 'علمي' },
  LITERARY: { label: 'أدبي' },
  COMMON: { label: 'مشترك' },
};

// Feed item types (matches Android FeedItemType enum)
export const FEED_ITEM_TYPES = {
  DEFINITION: 'DEFINITION',
  FORMULA: 'FORMULA',
  DATE: 'DATE',
  FACT: 'FACT',
  RULE: 'RULE',
  TIP: 'TIP',
  MINI_QUIZ: 'MINI_QUIZ',
};

export const FEED_ITEM_TYPE_CONFIG = {
  DEFINITION: { label: 'تعريف', icon: '📖', color: 'blue' },
  FORMULA: { label: 'معادلة', icon: '📐', color: 'purple' },
  DATE: { label: 'تاريخ', icon: '📅', color: 'orange' },
  FACT: { label: 'حقيقة', icon: '✓', color: 'green' },
  RULE: { label: 'قاعدة', icon: '📏', color: 'indigo' },
  TIP: { label: 'نصيحة', icon: '💡', color: 'yellow' },
  MINI_QUIZ: { label: 'سؤال سريع', icon: '🎯', color: 'red' },
};

// Interaction types for feed items (matches Android InteractionType enum)
export const INTERACTION_TYPES = {
  TAP_CONFIRM: 'TAP_CONFIRM',
  SWIPE_TF: 'SWIPE_TF',
  MCQ: 'MCQ',
  MATCH: 'MATCH',
};

export const INTERACTION_TYPE_CONFIG = {
  TAP_CONFIRM: { label: 'اضغط للتأكيد', icon: '👆' },
  SWIPE_TF: { label: 'اسحب صح/خطأ', icon: '👈👉' },
  MCQ: { label: 'اختيار من متعدد', icon: '🔘' },
  MATCH: { label: 'وصّل', icon: '🔗' },
};

// Question types (matches Android QuestionType enum)
export const QUESTION_TYPES = {
  TRUE_FALSE: 'TRUE_FALSE',
  MCQ: 'MCQ',
  FILL_BLANK: 'FILL_BLANK',
  MATCH: 'MATCH',
  SHORT_ANSWER: 'SHORT_ANSWER',
  EXPLAIN: 'EXPLAIN',
  LIST: 'LIST',
  TABLE: 'TABLE',
  FIGURE: 'FIGURE',
  COMPARE: 'COMPARE',
  ORDER: 'ORDER',
};

export const QUESTION_TYPE_CONFIG = {
  TRUE_FALSE: { label: 'صح أو خطأ', icon: '✓✗' },
  MCQ: { label: 'اختيار من متعدد', icon: '🔘' },
  FILL_BLANK: { label: 'أكمل الفراغ', icon: '___' },
  MATCH: { label: 'وصّل', icon: '🔗' },
  SHORT_ANSWER: { label: 'إجابة قصيرة', icon: '✏️' },
  EXPLAIN: { label: 'اشرح / علل', icon: '💬' },
  LIST: { label: 'اذكر', icon: '📝' },
  TABLE: { label: 'جدول', icon: '📊' },
  FIGURE: { label: 'من الشكل', icon: '🖼️' },
  COMPARE: { label: 'قارن', icon: '⚖️' },
  ORDER: { label: 'رتب', icon: '🔢' },
};
