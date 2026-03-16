'use client';
import { useDataStore }  from '@/store/dataStore';
import { useMediaStore } from '@/store/mediaStore';
import { useRouter }     from 'next/navigation';

const NAV = [
  { id: 'lessons',  icon: '◈', label: 'الدروس'      },
  { id: 'feeds',    icon: '▣', label: 'التغذية'      },
  { id: 'quizbank', icon: '◎', label: 'الأسئلة'      },
  { id: 'concepts', icon: '✦', label: 'المفاهيم'     },
  { id: 'media',    icon: '⬜', label: 'الوسائط'     },
  { id: 'export',   icon: '↑', label: 'تصدير'        },
];

export default function EditorSidebar({ currentPage, onNavigate, contributor }) {
  const { subject, lessons, concepts, feedItems, questions } = useDataStore();
  const { media } = useMediaStore();
  const router = useRouter();

  const counts = {
    lessons:  lessons.length,
    feeds:    feedItems.length,
    quizbank: questions.length,
    concepts: concepts.length,
    media:    media.length,
    export:   null,
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
  };

  return (
    <aside
      className="w-12 bg-ink-950 border-l border-ink-800/60 fixed right-0 top-0 h-screen flex flex-col items-center z-30"
      style={{ boxShadow: '-1px 0 0 0 rgba(255,255,255,0.03)' }}
    >
      {/* Logo mark */}
      <div className="w-full flex items-center justify-center py-4 border-b border-ink-800/60">
        <span
          className="text-base font-bold text-sand-500 font-arabic select-none"
          title={subject?.nameAr || 'نفير'}
        >
          ن
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center gap-0.5 py-3 w-full">
        {NAV.map((item) => {
          const active = currentPage === item.id || (currentPage === 'editor' && item.id === 'lessons');
          const count  = counts[item.id];
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={item.label}
              className={`
                relative w-full flex items-center justify-center py-3 transition-all group
                ${active
                  ? 'text-sand-300'
                  : 'text-ink-700 hover:text-ink-300'}
              `}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-sand-500 rounded-l" />
              )}

              <span className="text-base font-mono leading-none">{item.icon}</span>

              {/* Count bubble */}
              {count != null && count > 0 && (
                <span className={`
                  absolute top-2 left-2 min-w-[14px] h-3.5 flex items-center justify-center
                  text-[9px] font-mono rounded-full px-0.5
                  ${active
                    ? 'bg-sand-800 text-sand-400'
                    : 'bg-ink-800 text-ink-600 group-hover:bg-ink-700 group-hover:text-ink-400'}
                `}>
                  {count > 99 ? '99+' : count}
                </span>
              )}

              {/* Tooltip */}
              <span className="
                absolute right-full mr-2 px-2 py-1 bg-ink-800 border border-ink-700
                text-xs text-ink-200 font-arabic rounded-lg whitespace-nowrap
                opacity-0 pointer-events-none group-hover:opacity-100
                transition-opacity duration-150 z-50
                shadow-lg
              ">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom: contributor + signout */}
      <div className="flex flex-col items-center gap-1 pb-3 border-t border-ink-800/60 pt-3 w-full">
        {contributor && (
          <div
            className="w-7 h-7 rounded-full bg-sand-900 border border-sand-800/60 flex items-center justify-center"
            title={contributor.name}
          >
            <span className="text-xs font-bold text-sand-400 font-arabic">
              {contributor.name?.[0] || 'م'}
            </span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          title="تسجيل الخروج"
          className="w-full flex items-center justify-center py-2 text-ink-700 hover:text-red-500 transition-colors"
        >
          <span className="text-sm font-mono">⏻</span>
        </button>
      </div>
    </aside>
  );
}