/**
 * scripts/seed.js
 *
 * Seeds the database with:
 *   1. Default contributor roles (3 categories, 7 roles)
 *   2. First admin account — migrated from ADMIN_USERNAME / ADMIN_PASSWORD env vars
 *
 * Usage:
 *   node scripts/seed.js
 *   node scripts/seed.js --roles-only
 *   node scripts/seed.js --admin-only
 *
 * Safe to re-run — skips anything that already exists.
 */

import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

// ─── Inline models (no Next.js path aliases in plain Node) ───────────────────

const QuestionSchema = new mongoose.Schema(
  { text: String, placeholder: String, minChars: { type: Number, default: 80 }, order: Number },
  { _id: true }
);

const ContributorRoleSchema = new mongoose.Schema(
  {
    name: String, slug: String, category: String, subcategory: String,
    description: String, isActive: { type: Boolean, default: true }, order: Number,
    interviewQuestions: [QuestionSchema],
    microTask: { prompt: String, minChars: Number },
  },
  { timestamps: true }
);

const AdminSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true }, email: { type: String, unique: true },
    passwordHash: { type: String, select: false }, displayName: String,
    isActive: { type: Boolean, default: true }, lastSignedInAt: Date,
  },
  { timestamps: true }
);

const ContributorRole = mongoose.models.ContributorRole || mongoose.model('ContributorRole', ContributorRoleSchema);
const Admin           = mongoose.models.Admin           || mongoose.model('Admin',           AdminSchema);

// ─── Role definitions ─────────────────────────────────────────────────────────

const DEFAULT_ROLES = [

  // ── Content ──────────────────────────────────────────────────────────────
  {
    name:        'متخصص مادة',
    slug:        'subject-specialist',
    category:    'content',
    subcategory: 'متخصص مادة',
    description: 'يمتلك معرفة عميقة بمادة دراسية محددة ويساعد في بناء المحتوى الأساسي وضمان دقته العلمية.',
    order: 1,
    interviewQuestions: [
      {
        text:        'ما المادة التي تجيدها أكثر من غيرها، ولماذا؟',
        placeholder: 'أخبرنا عن علاقتك بهذه المادة وكيف طوّرت فهمك لها.',
        minChars:    80,
        order: 0,
      },
      {
        text:        'ما أصعب مفهوم في مادتك برأيك، وكيف تشرحه؟',
        placeholder: 'اشرح المفهوم كأنك تشرحه لطالب يسمعه لأول مرة.',
        minChars:    100,
        order: 1,
      },
      {
        text:        'ما أكبر خطأ شائع يقع فيه الطلاب في هذه المادة؟',
        placeholder: 'فكّر في أنماط الأخطاء التي تلاحظها أو وقعت فيها أنت.',
        minChars:    80,
        order: 2,
      },
    ],
    microTask: {
      prompt:   'اختر مفهوماً واحداً من مادتك وقدّم شرحاً واضحاً ومبسطاً له، موجّهاً لطالب في الصف الأول ثانوي.',
      minChars: 150,
    },
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
        text:        'لماذا تريد المساهمة في بشير؟',
        placeholder: 'بصدق، ما الذي دفعك للتقديم؟',
        minChars:    80,
        order: 0,
      },
      {
        text:        'كيف تبني شرحاً لفكرة صعبة؟ ما خطواتك؟',
        placeholder: 'صِف عملية التبسيط التي تتبعها عادةً.',
        minChars:    80,
        order: 1,
      },
      {
        text:        'ما أكبر مشكلة في طريقة تدريس المواد اليوم؟',
        placeholder: 'لا توجد إجابة صحيحة — رأيك الحقيقي يهمّنا.',
        minChars:    80,
        order: 2,
      },
    ],
    microTask: {
      prompt:   'اكتب مقدمة قصيرة لدرس عن أي مفهوم تختاره — يجب أن تشدّ انتباه الطالب وتجعله يريد أن يكمل القراءة.',
      minChars: 120,
    },
  },

  // ── Development ───────────────────────────────────────────────────────────
  {
    name:        'مطوّر باك إند',
    slug:        'backend-developer',
    category:    'development',
    subcategory: 'باك إند',
    description: 'يساهم في تطوير وتحسين الـ APIs وطبقة البيانات لمنصة نافير.',
    order: 1,
    interviewQuestions: [
      {
        text:        'ما تجربتك مع Node.js أو Next.js؟ وصف مشروعاً أنجزته.',
        placeholder: 'ما أكثر شيء تعلّمته منه؟',
        minChars:    80,
        order: 0,
      },
      {
        text:        'كيف تتعامل مع أداء قواعد البيانات عند الضغط العالي؟',
        placeholder: 'ما الاستراتيجيات التي تستخدمها؟',
        minChars:    80,
        order: 1,
      },
      {
        text:        'لماذا يجذبك هذا المشروع تحديداً؟',
        placeholder: 'ما الذي يميّزه عن مشاريع أخرى يمكنك المساهمة فيها؟',
        minChars:    60,
        order: 2,
      },
    ],
    microTask: {
      prompt:   'صمّم endpoint بسيط بـ Next.js App Router يقبل `POST /api/items` ويحفظ عنصراً في MongoDB. اكتب الكود مع تعليق على القرارات التي اتخذتها.',
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
        text:        'ما خبرتك مع تطوير تطبيقات أندرويد؟',
        placeholder: 'Kotlin, Java, Flutter, أو غيرها؟ ما المشاريع التي عملت عليها؟',
        minChars:    80,
        order: 0,
      },
      {
        text:        'كيف تتعامل مع offline-first في تطبيقات الموبايل؟',
        placeholder: 'ما أدواتك المفضلة للتخزين المحلي والمزامنة؟',
        minChars:    80,
        order: 1,
      },
      {
        text:        'ما تحدّي أداء واجهتك به في تطبيق موبايل وكيف حللته؟',
        placeholder: 'كن محدداً — الإجابات العامة لا تقول الكثير.',
        minChars:    80,
        order: 2,
      },
    ],
    microTask: {
      prompt:   'صف كيف ستبني شاشة عرض درس يعمل بدون إنترنت في تطبيق أندرويد. ما البنية التي ستختارها؟ ما التحديات المتوقعة؟',
      minChars: 150,
    },
  },

  // ── Design ────────────────────────────────────────────────────────────────
  {
    name:        'مصمم واجهات',
    slug:        'ui-designer',
    category:    'design',
    subcategory: 'واجهات',
    description: 'يصمّم تجارب المستخدم لتطبيق بشير ومنصة نافير — واضحة، عربية، وسهلة الاستخدام.',
    order: 1,
    interviewQuestions: [
      {
        text:        'ما أدوات التصميم التي تستخدمها وما أسلوبك في العمل؟',
        placeholder: 'Figma, Adobe XD, أو غيرها؟ وصف كيف تبدأ مشروعاً من الصفر.',
        minChars:    80,
        order: 0,
      },
      {
        text:        'ما أصعب تحدي واجهته في تصميم واجهة عربية؟',
        placeholder: 'RTL، التايبوغرافي، الثقافة المرئية — أي جانب استوقفك؟',
        minChars:    80,
        order: 1,
      },
      {
        text:        'كيف تتعامل مع التصميم لشريحة مستخدمين من بيئات مختلفة؟',
        placeholder: 'فكّر في طالب يستخدم هاتفاً متوسط المواصفات في بيئة تعليمية محدودة.',
        minChars:    80,
        order: 2,
      },
    ],
    microTask: {
      prompt:   'صِف تصوّرك لشاشة عرض درس في تطبيق تعليمي موجّه لطلاب المرحلة الثانوية. ما العناصر التي ستدرجها؟ ما التي ستحذفها؟ ولماذا؟',
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
        text:        'ما أسلوبك في الرسم وما الأدوات التي تستخدمها؟',
        placeholder: 'رقمي أم تقليدي؟ ما البرامج التي تتقنها؟',
        minChars:    60,
        order: 0,
      },
      {
        text:        'كيف تحوّل مفهوماً علمياً مجرداً إلى رسم واضح؟',
        placeholder: 'صف خطواتك من فهم المفهوم إلى الرسم النهائي.',
        minChars:    80,
        order: 1,
      },
    ],
    microTask: {
      prompt:   'اختر مفهوماً علمياً بسيطاً (مثل الدورة الدموية أو قانون نيوتن) وصِف بالتفصيل كيف ستوضّحه في رسمة واحدة — ما العناصر، الألوان، والتسميات التي ستستخدمها؟',
      minChars: 120,
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

async function seedRoles() {
  console.log('\n📋  Seeding contributor roles...');
  let created = 0;
  let skipped = 0;

  for (const role of DEFAULT_ROLES) {
    const exists = await ContributorRole.findOne({ slug: role.slug });
    if (exists) {
      console.log(`   ⟳  skipped (exists): ${role.name}`);
      skipped++;
      continue;
    }
    await ContributorRole.create(role);
    console.log(`   ✓  created: ${role.name} [${role.category}]`);
    created++;
  }

  console.log(`\n   Roles: ${created} created, ${skipped} skipped`);
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
  console.log('   ℹ️  You can now remove ADMIN_USERNAME and ADMIN_PASSWORD from your .env');
  console.log('      and manage admins entirely through the dashboard.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const rolesOnly = args.includes('--roles-only');
const adminOnly = args.includes('--admin-only');

async function main() {
  await connect();

  if (!adminOnly) await seedRoles();
  if (!rolesOnly) await seedAdmin();

  console.log('\n✅  Seed complete\n');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
