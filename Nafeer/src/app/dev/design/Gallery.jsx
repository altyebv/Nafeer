'use client';
import { useState } from 'react';
import { Clock, Eye, Plus, Trash2, Upload, CircleHelp, BookOpen, Layers, AlertTriangle, Moon, Sun, X } from 'lucide-react';
import {
  Button, IconButton, Field, Input, Textarea, Select, Card, Badge, Stat,
  Tabs, TabPanel, Segmented, PageHeader, SaveStatus, EmptyState, Dialog, Drawer,
  ConfirmButton, Eyebrow, SectionTitle,
} from '@/components/ui';
import { useThemeStore } from '@/store/themeStore';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { formatDate, formatNumber } from '@/lib/format';

// Every swatch is drawn with the real role class, so this page shows exactly
// what the tokens resolve to in the current theme.
const SURFACES = [
  ['bg-page', 'الصفحة'], ['bg-raised', 'بطاقة'], ['bg-sunken', 'حقل إدخال'], ['bg-chrome', 'الإطار والقوائم'],
  ['bg-hover', 'تمرير المؤشر'], ['bg-selected', 'عنصر محدّد'], ['bg-accent', 'الإجراء الرئيسي'], ['bg-accent-wash', 'تنبيه لطيف'],
];
const TEXT = [
  ['text-fg-strong', 'عنوان بارز — للعناوين'], ['text-fg', 'نص أساسي يُقرأ بسهولة'],
  ['text-fg-muted', 'وصف ثانوي يشرح ما فوقه'], ['text-fg-subtle', 'تلميح أو تاريخ'], ['text-fg-accent', 'رابط أو عنوان صغير'],
];
const TYPE = [
  ['t-display', 'بَشير'], ['t-h1', 'مساحة بناء الأسئلة'], ['t-h2', 'الجغرافيا الاقتصادية'],
  ['t-body', 'المنهج السوداني غني بالفعل — علم حقيقي ومفاهيم راسخة. المشكلة ليست فيما يُدرَّس، بل في الجسر بين الكتاب وعقل الطالب.'],
  ['t-title', 'المعلومات الأساسية'], ['t-ui', 'الدرس 3 · مسودة · 15 دقيقة'], ['t-label', 'عنوان الدرس'],
  ['t-caption', 'آخر تعديل منذ 5 دقائق بواسطة فاطمة'], ['t-eyebrow', 'لماذا بشير'],
];
const TONES = ['neutral', 'accent', 'success', 'warn', 'danger', 'info', 'special'];
const TONE_LABEL = { neutral: 'مسودة', accent: 'جغرافيا', success: 'منشور', warn: 'بانتظار المراجعة', danger: 'خطأ في الحفظ', info: 'قيد العمل', special: 'أدبي' };

function Section({ id, title, code, children }) {
  return (
    <Card as="section" aria-labelledby={id} padding="lg">
      <div className="flex items-baseline justify-between gap-3 mb-5">
        <h2 id={id} className="t-title text-fg-strong">{title}</h2>
        {code && <code dir="ltr" className="font-mono text-xs text-fg-subtle">{code}</code>}
      </div>
      {children}
    </Card>
  );
}

export default function Gallery() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const [tab, setTab] = useState('meta');
  const [learning, setLearning] = useState('UNDERSTANDING');
  const [dialog, setDialog] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [save, setSave] = useState('saved');
  const [deleted, setDeleted] = useState(0);
  const [title, setTitle] = useState('الدرس 1');

  return (
    <div className="min-h-dvh bg-page text-fg font-ui">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 flex flex-col gap-6">

        <PageHeader
          breadcrumb={[{ label: 'dev' }, { label: 'نظام التصميم' }]}
          title="نظام تصميم نفير"
          description="كل دور وكل مكوّن كما يظهر فعلاً في السمة الحالية. المرجع: docs/design-system.md"
          actions={
            <Button variant="secondary" icon={theme === 'dark' ? Sun : Moon} onClick={toggleTheme}>
              {theme === 'dark' ? 'السمة الفاتحة' : 'السمة الداكنة'}
            </Button>
          }
        />

        {/* ── Foundations ─────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Section id="s-surfaces" title="الأسطح" code="bg-*">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SURFACES.map(([cls, label]) => (
                <div key={cls} className="flex flex-col gap-1.5">
                  <div className={`h-14 rounded-control border border-line-strong ${cls}`} />
                  <span className="t-label text-fg">{label}</span>
                  <code dir="ltr" className="font-mono text-xs text-fg-subtle">{cls}</code>
                </div>
              ))}
            </div>
          </Section>

          <Section id="s-text" title="النص والخطوط" code="text-fg-* · border-line-*">
            <div className="flex flex-col">
              {TEXT.map(([cls, sample]) => (
                <div key={cls} className="flex items-baseline justify-between gap-3 py-2.5 border-b border-line">
                  <span className={`t-ui ${cls}`}>{sample}</span>
                  <code dir="ltr" className="font-mono text-xs text-fg-subtle">{cls}</code>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-4">
                {['border-line', 'border-line-strong', 'border-line-accent'].map((c) => (
                  <div key={c} className="flex-1 flex flex-col gap-1.5">
                    <div className={`border-t ${c}`} />
                    <code dir="ltr" className="font-mono text-xs text-fg-subtle">{c}</code>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>

        <Section id="s-type" title="سلّم الخط" code="t-*">
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-6 gap-y-4 items-baseline">
            {TYPE.map(([cls, sample]) => (
              <div key={cls} className="contents">
                <code dir="ltr" className="font-mono text-xs text-fg-accent">{cls}</code>
                <span className={`${cls} ${cls === 't-eyebrow' ? '' : 'text-fg'}`}>{sample}</span>
              </div>
            ))}
          </div>
        </Section>

        <div className="grid gap-6 lg:grid-cols-3">
          <Section id="s-status" title="الحالات" code="Badge">
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => <Badge key={t} tone={t}>{TONE_LABEL[t]}</Badge>)}
              <Badge tone="warn" icon={AlertTriangle}>بأيقونة</Badge>
              <Badge tone="info" size="sm">صغيرة</Badge>
            </div>
          </Section>
          <Section id="s-numbers" title="الأرقام" code="lib/format.js">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 t-ui">
              <dt className="text-fg-muted">عدد</dt><dd className="t-num">{formatNumber(12345)}</dd>
              <dt className="text-fg-muted">تاريخ</dt><dd>{formatDate(new Date(), 'medium')}</dd>
              <dt className="text-fg-muted">وقت</dt><dd>{formatDate(new Date(), 'time')}</dd>
              <dt className="text-fg-muted">شهر</dt><dd>{formatDate(new Date(), 'month')}</dd>
            </dl>
          </Section>
          <Section id="s-shape" title="الزوايا" code="rounded-*">
            <div className="grid grid-cols-4 gap-3 text-center">
              {[['rounded-chip', '6'], ['rounded-control', '10'], ['rounded-card', '14'], ['rounded-panel', '20']].map(([c, px]) => (
                <div key={c} className="flex flex-col items-center gap-1.5">
                  <div className={`w-12 h-12 bg-selected border border-line-strong ${c}`} />
                  <code dir="ltr" className="font-mono text-xs text-fg-subtle">{px}</code>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ── Components ──────────────────────────────────────────────── */}
        <SectionTitle eyebrow="DS1" title="المكوّنات" description="تعيش في src/components/ui وتقرأ أدوار الألوان فقط." className="pt-6" />

        <div className="grid gap-6 lg:grid-cols-2">
          <Section id="s-buttons" title="الأزرار" code="Button · IconButton">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="primary" icon={Upload}>إرسال للمراجعة</Button>
                <Button variant="secondary" icon={Eye}>معاينة</Button>
                <Button variant="ghost">إلغاء</Button>
                <Button variant="danger" icon={Trash2}>حذف القسم</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button size="sm">صغير</Button>
                <Button size="lg" variant="primary">كبير</Button>
                <Button variant="primary" loading>جارٍ الحفظ…</Button>
                <Button variant="primary" disabled>غير متاح</Button>
                <IconButton icon={Clock} label="السجل" variant="secondary" />
                <IconButton icon={Plus} label="إضافة" />
              </div>
              <p className="t-caption text-fg-subtle">primary واحد فقط في كل شاشة. زر الأيقونة يحمل تسمية وتلميحاً دائماً.</p>
            </div>
          </Section>

          <Section id="s-fields" title="الحقول" code="Field · Input · Textarea · Select">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="عنوان الدرس" hint="يظهر للطالب في قائمة الدروس" required
                error={/^الدرس \d+$/.test(title) ? 'هذا عنوان تلقائي — اكتب عنواناً حقيقياً' : undefined}>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="الوقت المقدّر" hint="بالدقائق">
                <Input type="number" defaultValue={15} dir="ltr" />
              </Field>
              <Field label="ملخص الدرس" className="sm:col-span-2">
                <Textarea placeholder="ملخص قصير يصف محتوى الدرس — يظهر في قائمة الدروس…" />
              </Field>
              <Field label="دور القسم" hint="يظهر فوق عنوان القسم في التطبيق">
                <Select defaultValue="CONCEPT">
                  <option value="GENERAL">بدون دور</option>
                  <option value="CONCEPT">الفكرة</option>
                  <option value="MODEL">النموذج</option>
                  <option value="EXAMPLE">مثال محلول</option>
                </Select>
              </Field>
              <Field label="معطّل">
                <Input disabled value="لا يمكن تعديله" readOnly />
              </Field>
            </div>
          </Section>

          <Section id="s-stats" title="الأرقام في البطاقات" code="Stat">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Stat value={12} label="درساً أنشأته" hint="+3 هذا الأسبوع" hintTone="success" icon={BookOpen} />
              <Stat value={148} label="سؤالاً في البنك" hint="آخرها أمس" icon={CircleHelp} />
              <Stat value="4/58" label="درساً مكتملاً" hint="في جغرافيا" icon={Layers} />
            </div>
          </Section>

          <Section id="s-tabs" title="التبويبات والاختيار" code="Tabs · Segmented">
            <div className="flex flex-col gap-5">
              <div className="border-b border-line">
                <Tabs
                  idBase="demo"
                  label="أقسام الدرس"
                  value={tab}
                  onChange={setTab}
                  items={[
                    { id: 'meta', label: 'البيانات' },
                    { id: 'body', label: 'المحتوى', count: 3 },
                    { id: 'questions', label: 'الأسئلة', count: 8 },
                    { id: 'feed', label: 'التغذية' },
                  ]}
                />
              </div>
              {['meta', 'body', 'questions', 'feed'].map((id) => (
                <TabPanel key={id} idBase="demo" id={id} active={tab === id} className="t-ui text-fg-muted">
                  لوحة «{id}» — جرّب الأسهم: في العربية السهم الأيسر يعني التالي.
                </TabPanel>
              ))}
              <div className="flex flex-col gap-2">
                <span className="t-label text-fg">نوع التعلّم في هذا القسم</span>
                <Segmented
                  label="نوع التعلّم"
                  value={learning}
                  onChange={setLearning}
                  items={[
                    { id: 'UNDERSTANDING', label: 'فهم', hint: 'يُفعّل المختبر والتدريب' },
                    { id: 'MEMORIZATION', label: 'حفظ', hint: 'يُضاف تلقائياً للتغذية' },
                    { id: 'HYBRID', label: 'فهم + حفظ', hint: 'يُفعّل كلاهما' },
                  ]}
                />
              </div>
            </div>
          </Section>
        </div>

        <Section id="s-header" title="رأس الصفحة وحالة الحفظ" code="PageHeader · SaveStatus">
          <div className="rounded-card border border-line bg-page px-5">
            <PageHeader
              breadcrumb={[{ label: 'المحرر', href: '/editor' }, { label: 'بنك الأسئلة' }]}
              title="بنك الأسئلة"
              description="ابحث، راجِع، وأضف أسئلة مرتبطة بالدروس."
              status={<SaveStatus state={save} savedAt={new Date()} dirtyCount={3} onRetry={() => setSave('saving')} />}
              actions={<><Button>استيراد</Button><Button variant="primary" icon={Plus}>سؤال جديد</Button></>}
            >
              <Tabs value="q" onChange={() => {}} label="نوع المحتوى" items={[{ id: 'q', label: 'الأسئلة', count: 148 }, { id: 'e', label: 'الامتحانات', count: 6 }]} />
            </PageHeader>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="t-caption text-fg-subtle">جرّب الحالات:</span>
            {['saved', 'saving', 'dirty', 'error'].map((s) => (
              <Button key={s} size="sm" variant={save === s ? 'primary' : 'secondary'} onClick={() => setSave(s)}>{s}</Button>
            ))}
          </div>
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section id="s-confirm" title="تأكيد الحذف، النوافذ والأدراج" code="ConfirmButton · Dialog · Drawer">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <ConfirmButton
                  icon={Trash2}
                  title="حذف «الفكرة الأساسية»؟"
                  description="سيُحذف القسم و4 عناصر بداخله. يمكنك التراجع من السجل."
                  onConfirm={() => setDeleted((n) => n + 1)}
                >
                  حذف القسم
                </ConfirmButton>
                <Button onClick={() => setDialog(true)}>افتح نافذة</Button>
                <Button onClick={() => setDrawer(true)}>افتح درجاً</Button>
              </div>
              <p className="t-caption text-fg-subtle">
                يبقى التأكيد مفتوحاً حتى تجيب أو تضغط Esc. حُذف {formatNumber(deleted)} مرة في هذه الصفحة.
              </p>
            </div>
          </Section>

          <Section id="s-empty" title="الحالة الفارغة" code="EmptyState">
            <EmptyState
              icon={CircleHelp}
              title="لا توجد أسئلة بعد"
              description="ابدأ بسؤال واحد مرتبط بدرس محدد، ثم وسّع البنك بالتدريج."
              action={<Button variant="primary" icon={Plus}>أضف أول سؤال</Button>}
            />
          </Section>
        </div>

        <Section id="s-eyebrow" title="عناوين الأقسام" code="Eyebrow · SectionTitle">
          <SectionTitle eyebrow="لماذا بشير" title="الإمكانية موجودة دائماً" description="نحتاج فقط الأداة المناسبة لإطلاقها — بلا تباعد حروف يكسر الكلمات العربية." />
          <div className="mt-4"><Eyebrow>داخل التطبيق</Eyebrow></div>
        </Section>

        <Section id="s-avatar" title="الصورة الشخصية" code="profile/AvatarPicker">
          <AvatarDemo />
        </Section>
      </div>

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="ربط درس كبديل"
        description="اختر درساً من نفس الوحدة ليظهر كطريقة شرح أخرى."
        footer={<><Button variant="ghost" onClick={() => setDialog(false)}>إلغاء</Button><Button variant="primary" onClick={() => setDialog(false)}>ربط</Button></>}
      >
        <Field label="الدرس المرتبط">
          <Select defaultValue="2"><option value="2">الدرس 2</option><option value="3">الدرس 3</option></Select>
        </Field>
      </Dialog>

      {drawer && (
        <Drawer onClose={() => setDrawer(false)} labelledBy="demo-drawer-title">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 id="demo-drawer-title" className="t-title text-fg-strong">ملاحظات الدرس</h2>
            <IconButton icon={X} label="إغلاق" size="sm" onClick={() => setDrawer(false)} />
          </div>
          <div className="p-5 t-ui text-fg-muted">جانبي على الشاشة الواسعة، ويصعد من الأسفل على الهاتف.</div>
        </Drawer>
      )}
    </div>
  );
}

function AvatarDemo() {
  const [url, setUrl] = useState(null);
  return <AvatarPicker name="نجوان مكي" value={url} onChange={(_, u) => setUrl(u)} />;
}
