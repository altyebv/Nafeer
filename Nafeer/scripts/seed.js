/**
 * scripts/seed.js
 *
 * Seeds the database with:
 *   1. Contributor roles (9 roles across 5 categories)
 *   2. First admin account — migrated from ADMIN_USERNAME / ADMIN_PASSWORD env vars
 *
 * Usage:
 *   node scripts/seed.js                  # skip existing, only add new
 *   node scripts/seed.js --force          # wipe all roles and reseed from scratch
 *   node scripts/seed.js --roles-only
 *   node scripts/seed.js --admin-only
 *
 * ⚠️  MODEL CHANGES NEEDED in lib/models/ContributorRole.js:
 *   1. Add 'operations' and 'community' to the category enum.
 *   2. Add subjectQuestionMap field (SubjectQuestionEntry array).
 *   See comments below for the schema additions.
 */

import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

// ─── Inline models (no Next.js path aliases in plain Node) ───────────────────

const QuestionSchema = new mongoose.Schema(
  { text: String, placeholder: String, minChars: { type: Number, default: 80 }, order: Number },
  { _id: true }
);

const MicroTaskSchema = new mongoose.Schema(
  { prompt: String, minChars: { type: Number, default: 80 } },
  { _id: false }
);

// Each entry maps a subjectId → tailored questions + micro-task.
// Add this to lib/models/ContributorRole.js:
//   const SubjectQuestionEntrySchema = new mongoose.Schema(
//     { subjectId: String, questions: [QuestionSchema], microTask: MicroTaskSchema },
//     { _id: false }
//   );
//   // then in ContributorRoleSchema:
//   subjectQuestionMap: { type: [SubjectQuestionEntrySchema], default: [] },
const SubjectQuestionEntrySchema = new mongoose.Schema(
  {
    subjectId: String,
    questions: [QuestionSchema],
    microTask: { type: MicroTaskSchema, default: () => ({}) },
  },
  { _id: false }
);

const ContributorRoleSchema = new mongoose.Schema(
  {
    name: String, slug: String, category: String, subcategory: String,
    description: String, isActive: { type: Boolean, default: true }, order: Number,
    interviewQuestions: [QuestionSchema],
    microTask:          { type: MicroTaskSchema, default: () => ({}) },
    subjectQuestionMap: { type: [SubjectQuestionEntrySchema], default: [] },
  },
  { timestamps: true }
);

const AdminSchema = new mongoose.Schema(
  {
    username:     { type: String, unique: true },
    email:        { type: String, unique: true },
    passwordHash: { type: String, select: false },
    displayName:  String,
    isActive:     { type: Boolean, default: true },
    lastSignedInAt: Date,
  },
  { timestamps: true }
);

const ContributorRole = mongoose.models.ContributorRole || mongoose.model('ContributorRole', ContributorRoleSchema);
const Admin           = mongoose.models.Admin           || mongoose.model('Admin',           AdminSchema);

// ─── Role definitions ─────────────────────────────────────────────────────────

const DEFAULT_ROLES = [

  // ══════════════════════════════════════════════════════════════════════════
  // ── CONTENT ──────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  {
    name:        'متخصص مادة',
    slug:        'subject-specialist',
    category:    'content',
    subcategory: 'متخصص مادة',
    description: 'يمتلك معرفة عميقة بمادة دراسية محددة ويساعد في بناء المحتوى الأساسي وضمان دقته العلمية.',
    order: 1,
    // Generic fallback — used when no subject-specific entry is found in subjectQuestionMap
    interviewQuestions: [
      {
        text:        'ما المادة التي تجيدها أكثر من غيرها، ولماذا؟',
        placeholder: 'أخبرنا عن علاقتك بهذه المادة وكيف طوّرت فهمك لها.',
        minChars:    80,
        order: 0,
      },
      {
        text:        'ما أصعب مفهوم في مادتك برأيك، وكيف تشرحه لمن يسمعه لأول مرة؟',
        placeholder: 'اشرح المفهوم كأنك تشرحه لطالب في الصف الأول ثانوي.',
        minChars:    100,
        order: 1,
      },
      {
        text:        'ما أكبر خطأ شائع يقع فيه الطلاب في هذه المادة؟ وما جذره الحقيقي؟',
        placeholder: 'فكّر في أنماط الأخطاء — لا الأخطاء السطحية.',
        minChars:    80,
        order: 2,
      },
    ],
    microTask: {
      prompt:   'اختر مفهوماً واحداً من مادتك وقدّم شرحاً واضحاً ومبسطاً له، موجّهاً لطالب في الصف الأول ثانوي.',
      minChars: 150,
    },
    // ── Per-subject tailored questions ────────────────────────────────────
    subjectQuestionMap: [
      {
        subjectId: 'QURAN',
        questions: [
          {
            text:        'ما مستوى حفظك للقرآن الكريم؟ وما الأسلوب الذي تتبعه في الضبط والتثبيت؟',
            placeholder: 'الحفظ الجزئي الراسخ أثمن من حفظ سطحي — كن صريحاً.',
            minChars: 80, order: 0,
          },
          {
            text:        'كيف تشرح حكماً من أحكام التجويد لطالب يسمعه لأول مرة؟ اذكر حكماً محدداً ومثاله.',
            placeholder: 'لا تكتفِ بالتعريف — أرنا أسلوبك في التبسيط.',
            minChars: 100, order: 1,
          },
          {
            text:        'ما أصعب ما يواجهه الطلاب في حفظ سورة النور أو تدبّرها؟ وكيف تعالجه؟',
            placeholder: 'فكّر في التحديات المحددة، لا في كليشيهات "القرآن صعب".',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'اختر آية من سورة النور أو من الآيات المختارة في المنهج وقدّم شرحاً مختصراً يجمع بين التفسير الإجمالي والفائدة التدبرية — لا تنقل من التفسير مباشرة، صُغه بأسلوبك.',
          minChars: 150,
        },
      },
      {
        subjectId: 'ARABIC',
        questions: [
          {
            text:        'أي فروع اللغة العربية الثلاثة في المنهج (المطالعة والأدب، النحو، البلاغة والتعبير) تجيده أكثر؟ ولماذا؟',
            placeholder: 'والأهم: أيها يجده الطلاب أصعب، وكيف تتعامل مع ذلك؟',
            minChars: 80, order: 0,
          },
          {
            text:        'ما الخطأ النحوي أو الأسلوبي الأكثر شيوعاً في كتابات طلاب الشهادة؟ وما جذره الحقيقي؟',
            placeholder: 'لا نريد قائمة أخطاء — نريد فهمك لسبب وقوعها.',
            minChars: 100, order: 1,
          },
          {
            text:        'كيف تجعل درس البلاغة ممتعاً لطالب يراه جافاً ومنفراً؟',
            placeholder: 'ما الزاوية التي تجعل الطالب يرى البلاغة في لغته اليومية؟',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'اشرح أحد أساليب البلاغة (الاستعارة، التشبيه، أو الكناية) بأسلوبك الخاص — اربطه بمثال من تجربة الطالب أو نص أدبي في المنهج، ووضّح كيف يختلف هذا الأسلوب عن التعبير المباشر.',
          minChars: 150,
        },
      },
      {
        subjectId: 'ENGLISH',
        questions: [
          {
            text:        'ما تقييمك لمستوى اللغة الإنجليزية لدى طلاب الثانوي السودانيين؟ ما أبرز الثغرات التي تلاحظها؟',
            placeholder: 'كن محدداً — ما الفجوة بين ما يُعلَّم وما يُحتاج فعلاً؟',
            minChars: 80, order: 0,
          },
          {
            text:        'ما الفرق بين تدريس قواعد اللغة بمعزل عن السياق وتدريسها من خلال النصوص؟ وأيهما تفضل ولماذا؟',
            placeholder: 'اذكر مثالاً: كيف تبني درساً نحوياً ينطلق من نص؟',
            minChars: 100, order: 1,
          },
          {
            text:        'كيف تبني نشاطاً يجعل الطالب يفهم المفردة أو التركيب لا يحفظهما فحسب؟',
            placeholder: 'الحفظ الأعمى وباء — أرنا عقّارك.',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'اختر كلمة أو تركيباً من مستوى B1–B2 يصعب على طلاب الثانوي فهمه أو استخدامه الصحيح، وقدّم شرحاً قصيراً بالعربية والإنجليزية يوضح المعنى، السياق، وفارق الاستخدام مع كلمة قريبة منه.',
          minChars: 150,
        },
      },
      {
        subjectId: 'MATH',
        questions: [
          {
            text:        'ما أصعب موضوع رياضي في منهج الشهادة يجده الطلاب؟ وما الأساس المفقود الذي يُسبّب هذه الصعوبة؟',
            placeholder: 'الصعوبة الحقيقية غالباً أعمق من الموضوع ذاته.',
            minChars: 80, order: 0,
          },
          {
            text:        'ما الفرق بين طالب يحفظ الخطوات وطالب يفهم المفهوم؟ وكيف تصمم شرحاً يبني الفهم لا الحفظ؟',
            placeholder: 'اذكر موضوعاً بعينه وأرنا كيف تعالجه.',
            minChars: 100, order: 1,
          },
          {
            text:        'كيف تربط موضوعاً رياضياً تجريدياً بمثال حياتي يجعل الطالب يرى لماذا يتعلمه؟',
            placeholder: 'المثال الواقعي الصادق أقوى من أي تعريف.',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'اختر مفهوماً من الوحدات الأولى (كالدوال أو المتتاليات أو الأعداد المركبة) وقدّم شرحاً يبدأ من الحس البصري أو الحياتي قبل الصيغة الرياضية — كيف يرى الطالب الفكرة قبل أن يحسبها؟',
          minChars: 150,
        },
      },
      {
        subjectId: 'MATH_SCIENCE',
        questions: [
          {
            text:        'ما الموضوعات في الرياضيات المتخصصة التي تشعر فيها بأنك مرجع موثوق؟ ومن أين اكتسبت هذا العمق؟',
            placeholder: 'كن صريحاً في حدود معرفتك — هذا أفيد من التبجح.',
            minChars: 80, order: 0,
          },
          {
            text:        'كيف تشرح مفهوماً متقدماً (كالتفاضل والتكامل أو المصفوفات) لطالب لا يمتلك البديهيات المسبقة؟',
            placeholder: 'من أين تبدأ قبل أن تكتب أي رمز رياضي؟',
            minChars: 100, order: 1,
          },
          {
            text:        'ما الفجوة الأكبر بين ما يحتاجه طالب العلمي في الرياضيات وما يُدرَّس له فعلاً؟',
            placeholder: 'رأيك النقدي قيّم — لكن ادعمه بملاحظة.',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'اختر مفهوماً من التفاضل أو التكامل أو الجبر الخطي وقدّم شرحاً تدريجياً: ما الحدس الذي يجعل الفكرة منطقية قبل الاشتقاق الصوري؟ استهدف طالباً يرى الموضوع لأول مرة.',
          minChars: 150,
        },
      },
      {
        subjectId: 'PHYSICS',
        questions: [
          {
            text:        'ما أكثر مفهوم فيزيائي يختلط فيه الطلاب بين الصيغة الرياضية ومعناها الفيزيائي الحقيقي؟',
            placeholder: 'المعادلة أداة والمفهوم هو الأساس — أين يضيع الطلاب؟',
            minChars: 80, order: 0,
          },
          {
            text:        'كيف تشرح مفهوم المجال الكهربائي أو القصور الذاتي لطالب دون اللجوء إلى معادلات أولاً؟',
            placeholder: 'ما الصورة أو التشبيه الذي يجعل الفكرة تُرى قبل أن تُحسب؟',
            minChars: 100, order: 1,
          },
          {
            text:        'في رأيك، أين الفجوة الكبرى بين الفيزياء التي يحلّ فيها الطلاب مسائل والفيزياء التي يفهمون بها العالم؟',
            placeholder: 'لا توجد إجابة صحيحة — نريد موقفك الحقيقي.',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'اختر ظاهرة فيزيائية قابلة للملاحظة في الحياة اليومية وربطها بمفهوم في الوحدات الأولى من المنهج — قدّم شرحاً يبدأ من الملاحظة، يمر بالمفهوم، ثم يصل للصيغة الرياضية إن لزم.',
          minChars: 150,
        },
      },
      {
        subjectId: 'CHEMISTRY',
        questions: [
          {
            text:        'ما الفرق الجوهري بين كيمياء يفهمها الطالب وكيمياء يحفظها فقط؟ وكيف تصنع الفارق في شرحك؟',
            placeholder: 'الكيمياء المحفوظة تختفي بعد الامتحان — الكيمياء المفهومة تبقى.',
            minChars: 80, order: 0,
          },
          {
            text:        'ما أصعب وحدة كيميائية في منهج الشهادة برأيك؟ وما سبب صعوبتها الحقيقية خلف الحجم والمصطلحات؟',
            placeholder: 'كن محدداً في تشخيص الصعوبة.',
            minChars: 100, order: 1,
          },
          {
            text:        'كيف تتعامل مع غياب التجارب العملية في بيئة تعليمية شحيحة الموارد؟',
            placeholder: 'ما البدائل الحقيقية — لا الوعود النظرية.',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'اشرح تفاعلاً كيميائياً واحداً (من باب التفاعل الحمضي القاعدي أو الأكسدة والاختزال) بأسلوب يناسب طالباً لا مختبر أمامه — كيف تبني له صورة ذهنية لما يحدث داخل المادة؟',
          minChars: 150,
        },
      },
      {
        subjectId: 'BIOLOGY',
        questions: [
          {
            text:        'ما الوحدة البيولوجية الأقرب لحياة الطالب اليومية؟ وكيف تستثمر هذا الربط لبناء فهم حقيقي؟',
            placeholder: 'الأحياء تحيط بنا — من أي باب تدخل منه؟',
            minChars: 80, order: 0,
          },
          {
            text:        'كيف تشرح عملية دقيقة كالانقسام الخلوي أو التركيب الضوئي دون رسوم توضيحية؟',
            placeholder: 'ما الكلمات والأمثلة التي تبني الصورة الذهنية؟',
            minChars: 100, order: 1,
          },
          {
            text:        'كيف تربط علم الأحياء بالوعي الصحي لدى الطالب — لا كمعلومة، بل كأثر يغيّر سلوكاً؟',
            placeholder: 'مثال واحد مُقنع أفضل من عشر نقاط نظرية.',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'اختر إحدى العمليات الحيوية في الجسم أو في الخلية وقدّم شرحاً تدريجياً يجعل الطالب يرى العملية لا يحفظها — ما الصورة أو التشبيه الذي يجعل الفكرة منطقية قبل المصطلحات؟',
          minChars: 150,
        },
      },
      {
        subjectId: 'ENGINEERING_SCI',
        questions: [
          {
            text:        'أي فروع علوم الهندسة الثلاثة (ميكانيكية، كهربائية، مدنية) تجيده أكثر؟ وما خلفيتك العملية أو الأكاديمية فيه؟',
            placeholder: 'مشاريع، دراسة، عمل — أي نوع من الخبرة تمتلك؟',
            minChars: 80, order: 0,
          },
          {
            text:        'كيف تربط مبادئ الرسم الهندسي بالتطبيق الفعلي لطالب يراه تمريناً ورقياً فارغاً؟',
            placeholder: 'ما الأمثلة الحقيقية التي تجعله يرى لماذا يهم هذا؟',
            minChars: 100, order: 1,
          },
          {
            text:        'ما أكبر سوء فهم يقع فيه الطلاب في مادة علوم الهندسة — ليس في المفردات، بل في الفهم الجوهري؟',
            placeholder: 'كن محدداً.',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'اشرح مبدأً هندسياً من الوحدة الأولى (الرسم الهندسي) أو من إحدى الوحدات التقنية بأسلوب يجمع بين التعريف الدقيق والتطبيق المرئي — ما الذي يراه المهندس في هذا المبدأ لا يراه الطالب؟',
          minChars: 150,
        },
      },
      {
        subjectId: 'CS',
        questions: [
          {
            text:        'ما خلفيتك البرمجية والتقنية؟ وأي موضوعات منهج علوم الحاسوب تقع في صميم قوتك؟',
            placeholder: 'كن واضحاً في حدود معرفتك — ليس كل موضوع يجب أن تُجيده.',
            minChars: 80, order: 0,
          },
          {
            text:        'كيف تشرح مفهوماً مجرداً كالخوارزمية أو بنية البيانات لطالب لم يكتب سطراً من الكود قط؟',
            placeholder: 'من أي حدس يومي تبدأ قبل الصياغة التقنية؟',
            minChars: 100, order: 1,
          },
          {
            text:        'ما الفجوة الحقيقية بين تعليم علوم الحاسوب بشكله النظري وبناء فهم حقيقي للتفكير الحسابي؟',
            placeholder: 'هل المشكلة في المنهج؟ الترتيب؟ الطريقة؟ حدّد.',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'اشرح مفهوم الخوارزميات البيانية أو الدوائر المنطقية بأسلوب يناسب طالباً ثانوياً يسمعه لأول مرة — ابدأ بمثال يعيشه يومياً قبل أي رمز أو رسم تقني.',
          minChars: 150,
        },
      },
      {
        subjectId: 'HISTORY',
        questions: [
          {
            text:        'ما الفرق بين رواية التاريخ وتحليله؟ وكيف تعكس هذا الفرق في طريقة تعليمك؟',
            placeholder: 'التاريخ حقائق + تفسير + سياق — أيها يُهمَل في الفصل عادةً؟',
            minChars: 80, order: 0,
          },
          {
            text:        'ما أصعب وحدة في تاريخ السودان الحديث لتدريسها؟ وما الذي يجعلها صعبة على المعلم لا على الطالب فحسب؟',
            placeholder: 'كن صريحاً — الصعوبات الحقيقية نادراً ما يُعترف بها.',
            minChars: 100, order: 1,
          },
          {
            text:        'كيف تجعل الطالب يرى صلة الأحداث التاريخية بواقعه اليوم — لا كمادة للحفظ، بل كمرآة؟',
            placeholder: 'مثال واحد حقيقي أقوى من أي بيان عن أهمية التاريخ.',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'اكتب مدخلاً تعليمياً لإحدى وحدات تاريخ السودان (الثورة المهدية أو الحكم الثنائي أو حركات التحرر) يدفع الطالب إلى التساؤل لا التلقين — ما السؤال الذي تفتح به الباب؟',
          minChars: 150,
        },
      },
      {
        subjectId: 'GEOGRAPHY',
        questions: [
          {
            text:        'ما الجانب الجغرافي الذي تجد الطلاب أكثر إهمالاً له: الجغرافيا الطبيعية، الاقتصادية، أم البشرية؟ ولماذا؟',
            placeholder: 'الجغرافيا الاقتصادية الأكثر جفافاً في التدريس — هل تتفق؟',
            minChars: 80, order: 0,
          },
          {
            text:        'كيف تشرح قراءة الصور الجوية وتفسيرها لطالب لم يتعامل معها قط؟',
            placeholder: 'بدون تقنية — بدون جملة "الصورة الجوية هي..."',
            minChars: 100, order: 1,
          },
          {
            text:        'كيف تجعل موضوع الجغرافيا الاقتصادية ذا معنى لطالب يعيش في منطقة زراعية أو حضرية محددة؟',
            placeholder: 'البيئة المحيطة بالطالب مادة خام — كيف تستثمرها؟',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'اختر ظاهرة جغرافية أو اقتصادية من المنهج وقدّم شرحاً يربطها ببيئة يعيشها طالب سوداني — كيف تُرى في المشهد اليومي قبل أن تُوصف في الكتاب؟',
          minChars: 150,
        },
      },
      {
        subjectId: 'ISLAMIC_STUDIES',
        questions: [
          {
            text:        'أي مجالات الدراسات الإسلامية في المنهج تجيده أكثر: الفقه وأصوله، علوم الحديث، أم النظام الاقتصادي الإسلامي؟',
            placeholder: 'ومن أين جاء هذا العمق — دراسة، تلقي، بحث ذاتي؟',
            minChars: 80, order: 0,
          },
          {
            text:        'كيف تقدّم مسألة فقهية أو أصولية لطالب ثانوي دون أن تُسقط عليه التعقيد الأكاديمي؟',
            placeholder: 'التبسيط مهارة — أرنا مثالاً على مسألة وكيف تبسّطها.',
            minChars: 100, order: 1,
          },
          {
            text:        'كيف توازن بين التلقين وتشجيع التفكير النقدي عند تدريس الدراسات الإسلامية؟',
            placeholder: 'هذا توتر حقيقي — لا تتجاهله.',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'اشرح أحد مبادئ النظام الاقتصادي الإسلامي أو مسألة من أصول الفقه بأسلوب يجعلها قابلة للفهم والتطبيق لطالب لا خلفية أكاديمية له في العلوم الشرعية.',
          minChars: 150,
        },
      },
      {
        subjectId: 'MILITARY_SCI',
        questions: [
          {
            text:        'ما خلفيتك في علوم الاستراتيجية والتاريخ العسكري؟ وما مصادرك في بناء هذه المعرفة؟',
            placeholder: 'الأكاديمي والقراءة الذاتية والتجربة — أيها أثّر أكثر؟',
            minChars: 80, order: 0,
          },
          {
            text:        'كيف تشرح مفهوم الاستراتيجية القومية أو العقيدة العسكرية لطالب ثانوي دون أن يبدو المحتوى رسمياً جافاً؟',
            placeholder: 'المفاهيم العسكرية تعيش في أحداث وشخصيات — أين تبدأ؟',
            minChars: 100, order: 1,
          },
          {
            text:        'كيف تربط دروس فن الحرب وصفات القائد بالمبادئ الإسلامية في المنهج؟',
            placeholder: 'المزاوجة بين التراث الإسلامي والفكر الاستراتيجي تحتاج لحرفة.',
            minChars: 80, order: 2,
          },
        ],
        microTask: {
          prompt:   'قدّم شرحاً لأحد موضوعات المنهج (صفات القائد، توجيهات الإسلام في القيادة، أو نموذج من المعارك التاريخية) بأسلوب يمزج بين التحليل والتجربة الإنسانية — ما الذي يجعل الطالب يرى المبدأ لا يحفظه؟',
          minChars: 150,
        },
      },
    ],
  },

  {
    name:        'كاتب دروس',
    slug:        'lesson-writer',
    category:    'content',
    subcategory: 'كاتب دروس',
    description: 'يتخصص في تحويل المفاهيم إلى دروس منظّمة وواضحة باستخدام أداة تحرير نافير.',
    order: 2,
    interviewQuestions: [
      {
        text:        'ما الذي دفعك للتقديم لنافير تحديداً، وليس لمشروع آخر؟',
        placeholder: 'بصدق — اللحظة أو السبب الحقيقي، لا العبارات الرنانة.',
        minChars:    80,
        order: 0,
      },
      {
        text:        'كيف تبني شرحاً لفكرة صعبة؟ صِف خطواتك من اللحظة التي تقرأ فيها الموضوع حتى الجملة الأخيرة.',
        placeholder: 'نريد العملية الداخلية — لا القائمة المثالية.',
        minChars:    100,
        order: 1,
      },
      {
        text:        'ما أكبر عيب في طريقة تقديم المحتوى التعليمي السوداني اليوم؟ وكيف تعتزم تجاوزه في كتابتك؟',
        placeholder: 'نقد حقيقي + إجابة حقيقية — لا توجد إجابة مثالية.',
        minChars:    80,
        order: 2,
      },
    ],
    microTask: {
      prompt:   'اكتب مقدمة قصيرة لدرس عن أي مفهوم تختاره — يجب أن تشدّ انتباه الطالب وتجعله يريد أن يكمل القراءة. لا تبدأ بتعريف.',
      minChars: 120,
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ── DEVELOPMENT ──────────────────────────────────────════════════════════
  // ══════════════════════════════════════════════════════════════════════════
  {
    name:        'مطوّر باك إند',
    slug:        'backend-developer',
    category:    'development',
    subcategory: 'باك إند',
    description: 'يساهم في تطوير وتحسين الـ APIs وطبقة البيانات لمنصة نافير.',
    order: 1,
    interviewQuestions: [
      {
        text:        'ما تجربتك مع Node.js أو Next.js؟ صف مشروعاً أنجزته وما أصعب قرار اتخذته فيه.',
        placeholder: 'القرارات الصعبة تكشف مستوى الفهم أكثر من القائمة التقنية.',
        minChars:    80,
        order: 0,
      },
      {
        text:        'كيف تتعامل مع أداء قواعد البيانات تحت الضغط؟ اذكر استراتيجيات استخدمتها أو درستها.',
        placeholder: 'Indexing, caching, aggregation pipeline — ما الذي تمتلكه فعلاً؟',
        minChars:    80,
        order: 1,
      },
      {
        text:        'لماذا يجذبك هذا المشروع تحديداً؟ ما الذي يميّزه عن مشروع مفتوح المصدر آخر؟',
        placeholder: 'إجابة صادقة أفيد من إجابة مدروسة.',
        minChars:    60,
        order: 2,
      },
    ],
    microTask: {
      prompt:   'صمّم endpoint بسيط بـ Next.js App Router يقبل `POST /api/items` ويحفظ عنصراً في MongoDB. اكتب الكود مع تعليق على القرارات التي اتخذتها — خاصة ما يتعلق بالتحقق من البيانات ومعالجة الأخطاء.',
      minChars: 150,
    },
  },

  {
    name:        'مطوّر موبايل',
    slug:        'mobile-developer',
    category:    'development',
    subcategory: 'موبايل',
    description: 'يساهم في تطوير تطبيق بشير الأندرويد — يعمل بدون إنترنت ويخدم طلاب الشهادة.',
    order: 2,
    interviewQuestions: [
      {
        text:        'ما خبرتك مع تطوير تطبيقات أندرويد؟ Kotlin, Compose, أو غيرها؟ صِف مشروعاً وما أكثر شيء تعلمته منه.',
        placeholder: 'المشاريع الحقيقية — حتى لو كانت صغيرة — أفصح من الشهادات.',
        minChars:    80,
        order: 0,
      },
      {
        text:        'كيف تتعامل مع offline-first في تطبيقات الموبايل؟ ما أدواتك للتخزين المحلي والمزامنة؟',
        placeholder: 'Room, DataStore, WorkManager — ما الذي تفضله ولماذا؟',
        minChars:    80,
        order: 1,
      },
      {
        text:        'ما أصعب تحدٍّ أدائي واجهك في تطبيق موبايل؟ كيف اكتشفته وكيف حللته؟',
        placeholder: 'كن محدداً — الإجابات العامة لا تقول شيئاً.',
        minChars:    80,
        order: 2,
      },
    ],
    microTask: {
      prompt:   'صف كيف ستبني شاشة عرض درس تعمل بدون إنترنت في تطبيق أندرويد. ما البنية التي ستختارها؟ كيف تتدفق البيانات من Room للواجهة؟ وما التحديات المتوقعة؟',
      minChars: 150,
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ── DESIGN ───────────────────────────────────────────════════════════════
  // ══════════════════════════════════════════════════════════════════════════
  {
    name:        'مصمم واجهات',
    slug:        'ui-designer',
    category:    'design',
    subcategory: 'واجهات',
    description: 'يصمّم تجارب المستخدم لتطبيق بشير ومنصة نفير — واضحة، عربية، وسهلة الاستخدام.',
    order: 1,
    interviewQuestions: [
      {
        text:        'ما أدوات التصميم التي تستخدمها؟ صِف كيف تبدأ مشروعاً من الصفر — عملية، لا قائمة.',
        placeholder: 'من أين تبدأ قبل أن تفتح Figma أو أي برنامج؟',
        minChars:    80,
        order: 0,
      },
      {
        text:        'ما أصعب تحدٍّ واجهك في تصميم واجهة عربية (RTL، التايبوغرافي، البنية المرئية)؟ وكيف تجاوزته؟',
        placeholder: 'تجربة محددة أفيد من وصف عام.',
        minChars:    80,
        order: 1,
      },
      {
        text:        'كيف تُصمّم لمستخدم يستخدم هاتفاً متوسط المواصفات في بيئة تعليمية ضعيفة الإضاءة والتركيز؟',
        placeholder: 'التصميم للقدرة المحدودة يكشف مستوى الفهم — ليس تصميم الـ Mockup الجذاب.',
        minChars:    80,
        order: 2,
      },
    ],
    microTask: {
      prompt:   'صِف تصوّرك لشاشة عرض درس في تطبيق تعليمي موجّه لطلاب الثانوي. ما العناصر التي ستدرجها؟ ما التي ستحذفها وما سبب الحذف؟ كيف يتغير التصميم بين قارئ مركّز وآخر يتصفح بسرعة؟',
      minChars: 120,
    },
  },

  {
    name:        'رسّام توضيحي',
    slug:        'illustrator',
    category:    'design',
    subcategory: 'رسوم توضيحية',
    description: 'يُنتج رسوماً توضيحية وعلمية تُبسّط المفاهيم الدراسية وتجعل المحتوى أكثر جاذبية.',
    order: 2,
    interviewQuestions: [
      {
        text:        'ما أسلوبك في الرسم وما الأدوات التي تتقنها؟ وهل لديك أعمال سابقة يمكنك الإشارة إليها؟',
        placeholder: 'رقمي أم تقليدي؟ ما الأسلوب البصري الذي تسكن فيه؟',
        minChars:    60,
        order: 0,
      },
      {
        text:        'كيف تحوّل مفهوماً علمياً مجرداً إلى رسم واضح؟ صِف خطواتك من فهم المفهوم إلى الخط الأول.',
        placeholder: 'الترجمة من النص إلى البصر ليست تلقائية — كيف يعمل ذهنك؟',
        minChars:    80,
        order: 1,
      },
    ],
    microTask: {
      prompt:   'اختر مفهوماً علمياً بسيطاً (الدورة الدموية، قانون نيوتن، أو التركيب الضوئي) وصِف بالتفصيل كيف ستوضّحه في رسمة واحدة — ما العناصر، الألوان، التسميات، والقرارات البصرية التي ستتخذها؟',
      minChars: 120,
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ── OPERATIONS ───────────────────────────────────────────────────────────
  // (Add 'operations' to ContributorRole category enum in lib/models/ContributorRole.js)
  // ══════════════════════════════════════════════════════════════════════════
  {
    name:        'منسق محتوى',
    slug:        'content-coordinator',
    category:    'operations',
    subcategory: 'تنسيق',
    description: 'يُنسّق عمل المساهمين في قسم المحتوى — يتابع التقدم، يحل العوائق، ويضمن سير الإنتاج بانتظام وفاعلية.',
    order: 1,
    interviewQuestions: [
      {
        text:        'صِف نظاماً استخدمته لمتابعة تقدم مجموعة نحو هدف مشترك. ما الذي نجح؟ وما الذي كشف له حدوداً لم تتوقعها؟',
        placeholder: 'لا نريد أسماء الأدوات — نريد كيف تفكر في التنظيم.',
        minChars:    100,
        order: 0,
      },
      {
        text:        'تخيّل أن أحد المساهمين توقف عن التسليم دون إشعار منذ أسبوعين. ما خطواتك؟ وأين الحد بين المتابعة والضغط؟',
        placeholder: 'الإجابة الصادقة أفيد من الإجابة الإدارية الناعمة.',
        minChars:    100,
        order: 1,
      },
      {
        text:        'ما الفرق بين التنسيق الفعّال والبيروقراطية المُعيقة؟ وكيف تضمن أن عملك يُسرّع الآخرين لا يُعيقهم؟',
        placeholder: 'فكّر في تجربة مررت بها — مباشرة أو كمشاهد.',
        minChars:    80,
        order: 2,
      },
    ],
    microTask: {
      prompt:   'لديك 8 مساهمين، كل منهم مسؤول عن مادة مختلفة، وأمامكم 3 أسابيع لإنجاز أول دفعة من الدروس. صمّم خطة تنسيق مختصرة: ما المعلومات التي تجمعها أولاً؟ ما نقاط التفتيش الأسبوعية؟ وكيف تتعامل مع التأخر الفعلي — لا النظري؟',
      minChars: 200,
    },
  },

  {
    name:        'مراجع جودة',
    slug:        'qa-reviewer',
    category:    'operations',
    subcategory: 'جودة',
    description: 'يراجع الدروس والمحتوى المُقدَّم ويتحقق من جودته — دقةً علميةً، وضوحاً، واتساقاً مع معايير المنصة.',
    order: 2,
    interviewQuestions: [
      {
        text:        'ما الفرق بين مراجعة المحتوى لتصحيح الأخطاء ومراجعته للارتقاء بجودته؟ وكيف تُترجم هذا الفرق عملياً؟',
        placeholder: 'نريد رؤية كيف تتعامل مع محتوى حقيقي — لا مجرد تعريف.',
        minChars:    100,
        order: 0,
      },
      {
        text:        'كيف تُقدّم ملاحظة نقدية لمساهم عمل بجهد على درس يفتقر للوضوح — دون إحباطه ودون مجاملة تُضيّع المعيار؟',
        placeholder: 'التوازن هنا صعب — أخبرنا كيف تفكر فيه.',
        minChars:    100,
        order: 1,
      },
      {
        text:        'ما المعيار الذي تستخدمه لتقرر أن درساً جاهز للنشر؟ وما أصعب حالة قرار تتخيلها في هذا الدور؟',
        placeholder: 'ليست هناك إجابة ثنائية — نريد منطقك الحقيقي.',
        minChars:    80,
        order: 2,
      },
    ],
    microTask: {
      prompt:   'إليك مقطعاً من درس مُقدَّم للمراجعة: "التفاعل الكيميائي هو تغيير يحدث للمادة. يوجد نوعان: فيزيائي وكيميائي. الفيزيائي لا يغير التركيب. الكيميائي يغيره. مثال: الحرق تفاعل كيميائي". اكتب مراجعتك: ما إيجابياته؟ ما نقاط ضعفه التحريرية والعلمية؟ وكيف تقترح تطويره بشكل محدد؟',
      minChars: 200,
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ── COMMUNITY ────────────────────────────────────────────────────────────
  // (Add 'community' to ContributorRole category enum in lib/models/ContributorRole.js)
  // ══════════════════════════════════════════════════════════════════════════
  {
    name:        'مدير مجتمع',
    slug:        'community-manager',
    category:    'community',
    subcategory: 'مجتمع',
    description: 'يبني مجتمع المساهمين ويُديره — يُرحّب بالأعضاء الجدد، يحافظ على الروح المعنوية، ويحل الاحتكاكات.',
    order: 1,
    interviewQuestions: [
      {
        text:        'ما الفرق بين مجتمع نشط ومجتمع حيّ؟ وكيف تحوّل قناة مجرد إلى مكان يريد الناس أن يكونوا فيه؟',
        placeholder: 'لا إجابة مثالية — نريد فهمك الحقيقي للمجتمع.',
        minChars:    100,
        order: 0,
      },
      {
        text:        'كيف تتعامل مع مساهم يبث إحباطه بشكل سلبي في القناة المشتركة — دون إسكاته ودون تجاهله؟',
        placeholder: 'الحالة حقيقية وتحتاج لتصرف، لا نظرية.',
        minChars:    100,
        order: 1,
      },
      {
        text:        'ما الذي يجعل إنساناً يُكمل التزامه بمشروع تطوعي رغم ضيق وقته وضغوطه؟ وكيف تستثمر هذا الفهم في عملك مع المساهمين؟',
        placeholder: 'تجربتك الشخصية مع الالتزام التطوعي مرجع ثمين هنا.',
        minChars:    80,
        order: 2,
      },
    ],
    microTask: {
      prompt:   'انضم مساهم جديد إلى قناة نافير. ما رسالة الترحيب التي ترسلها له؟ وما الخطوات التي تتخذها خلال أسبوعه الأول لتجعله يشعر بأنه جزء حقيقي من المشروع — لا مجرد رقم في قائمة؟ كن محدداً.',
      minChars: 180,
    },
  },
];

// ─── Connect ──────────────────────────────────────────────────────────────────

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI not set in environment');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('✅  Connected to MongoDB');
}

// ─── Seed roles ───────────────────────────────────────────────────────────────

async function seedRoles(force = false) {
  console.log(`\n📋  Seeding contributor roles${force ? ' (--force: wiping existing roles)' : ''}...`);

  if (force) {
    const deleted = await ContributorRole.deleteMany({});
    console.log(`   🗑  Deleted ${deleted.deletedCount} existing roles`);
  }

  let created = 0;
  let skipped = 0;

  for (const role of DEFAULT_ROLES) {
    const exists = await ContributorRole.findOne({ slug: role.slug });
    if (exists && !force) {
      console.log(`   ⟳  skipped (exists): ${role.name}`);
      skipped++;
      continue;
    }
    await ContributorRole.create(role);
    console.log(`   ✓  created: ${role.name} [${role.category}]`);
    created++;
  }

  console.log(`\n   Roles: ${created} created, ${skipped} skipped`);
  console.log(`   Total: ${DEFAULT_ROLES.length} roles defined`);
}

// ─── Seed first admin ─────────────────────────────────────────────────────────

async function seedAdmin() {
  console.log('\n👤  Seeding first admin...');

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const email    = process.env.ADMIN_EMAIL || `${username}@nafeer.local`;

  if (!username || !password) {
    console.warn('   ⚠️  ADMIN_USERNAME or ADMIN_PASSWORD not set — skipping admin seed');
    console.warn('      Set these env vars, or create an admin manually via the dashboard after seeding roles.');
    return;
  }

  const existing = await Admin.findOne({ username: username.toLowerCase() });
  if (existing) {
    console.log(`   ⟳  Admin @${username} already exists — skipped`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await Admin.create({
    username:    username.toLowerCase(),
    email:       email.toLowerCase(),
    displayName: 'Admin',
    passwordHash,
    isActive:    true,
  });

  console.log(`   ✓  Admin created: @${username}`);
  console.log('   ℹ️  You can now remove ADMIN_USERNAME / ADMIN_PASSWORD from your .env');
  console.log('      and manage admins entirely through the dashboard.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const args      = process.argv.slice(2);
const rolesOnly = args.includes('--roles-only');
const adminOnly = args.includes('--admin-only');
const force     = args.includes('--force');

async function main() {
  await connect();

  if (!adminOnly) await seedRoles(force);
  if (!rolesOnly) await seedAdmin();

  console.log('\n✅  Seed complete\n');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});