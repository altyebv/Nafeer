'use client';
import { useDataStore } from '@/store/dataStore';
import { useRouter }    from 'next/navigation';

const navItems = [
  { id: 'lessons',  label: 'الدروس',         icon: '📖', desc: 'وحدات ودروس ومحتوى' },
  { id: 'feeds',    label: 'التغذية',         icon: '📱', desc: 'بطاقات المراجعة السريعة' },
  { id: 'quizbank', label: 'بنك الأسئلة',     icon: '🎯', desc: 'أسئلة وامتحانات' },
  { id: 'concepts', label: 'المفاهيم',        icon: '💡', desc: 'الوحدة الذرية للمعرفة' },
  { id: 'export',   label: 'تصدير',           icon: '📤', desc: 'تصدير JSON للتطبيق' },
];

export default function EditorSidebar({ currentPage, onNavigate, contributor }) {
  const {
    subject, units, lessons,
    concepts, feedItems, questions, exams,
  } = useDataStore();
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
  };

  const counts = {
    lessons:  lessons.length,
    feeds:    feedItems.length,
    quizbank: questions.length,
    concepts: concepts.length,
    export:   null,
  };

  return (
    <aside className="w-64 bg-ink-900 border-l border-ink-800 fixed right-0 top-0 h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-ink-800">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xl font-bold text-sand-400 font-arabic">نفير</span>
          <span className="text-xs px-2 py-0.5 bg-ink-800 text-ink-400 rounded font-mono border border-ink-700">
            editor
          </span>
        </div>
        <p className="text-xs text-ink-600 font-arabic">بوابة المساهمين</p>
      </div>

      {/* Contributor info */}
      {contributor && (
        <div className="px-4 py-3 border-b border-ink-800 bg-ink-800/40">
          <p className="text-sm font-medium text-sand-300 font-arabic">{contributor.name}</p>
          <p className="text-xs text-ink-500 font-arabic">{contributor.subject}</p>
        </div>
      )}

      {/* Subject badge */}
      {subject && (
        <div className="px-4 py-2.5 border-b border-ink-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sand-500" />
            <span className="text-sm text-sand-300 font-arabic font-medium">{subject.nameAr}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const active = currentPage === item.id || (currentPage === 'editor' && item.id === 'lessons');
          const count  = counts[item.id];
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-right group
                ${active
                  ? 'bg-sand-900/50 text-sand-300 border border-sand-800/60'
                  : 'text-ink-400 hover:bg-ink-800 hover:text-ink-200 border border-transparent'
                }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="flex-1 text-sm font-arabic">{item.label}</span>
              {count !== null && count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded font-mono
                  ${active ? 'bg-sand-800 text-sand-400' : 'bg-ink-800 text-ink-500 group-hover:text-ink-400'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Stats */}
      <div className="p-4 border-t border-ink-800 space-y-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {[
            { label: 'وحدات',    val: units.length    },
            { label: 'دروس',     val: lessons.length  },
            { label: 'مفاهيم',   val: concepts.length },
            { label: 'أسئلة',    val: questions.length },
            { label: 'امتحانات', val: exams.length    },
            { label: 'تغذية',    val: feedItems.length },
          ].map(({ label, val }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-ink-600 font-arabic">{label}</span>
              <span className="text-xs font-mono text-ink-400">{val}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleSignOut}
          className="w-full text-xs text-ink-600 hover:text-red-400 transition-colors py-1.5 text-right font-arabic"
        >
          تسجيل الخروج ←
        </button>
      </div>
    </aside>
  );
}
