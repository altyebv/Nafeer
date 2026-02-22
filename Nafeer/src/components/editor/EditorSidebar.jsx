'use client';
import { useDataStore } from '@/store/dataStore';
import { useRouter } from 'next/navigation';

const navItems = [
  { id: 'lessons', label: 'الدروس', icon: '📖' },
  { id: 'concepts', label: 'المفاهيم', icon: '💡' },
  { id: 'feeds', label: 'عناصر التغذية', icon: '📱' },
  { id: 'export', label: 'تصدير', icon: '📤' },
];

export default function EditorSidebar({ currentPage, onNavigate, contributor }) {
  const { subject, units, lessons, concepts, feedItems } = useDataStore();
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
  };

  return (
    <aside className="w-64 bg-ink-900 border-l border-ink-800 fixed right-0 top-0 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-ink-800">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-sand-400">نفير</h1>
          <span className="text-xs px-2 py-0.5 bg-sand-900/50 text-sand-500 rounded font-mono border border-sand-800/50">
            أداة التحرير
          </span>
        </div>
        <p className="text-xs text-ink-500">بوابة المساهمين</p>
      </div>

      {/* Contributor info */}
      {contributor && (
        <div className="px-4 py-3 border-b border-ink-800 bg-ink-800/30">
          <p className="text-sm font-medium text-sand-300">{contributor.name}</p>
          <p className="text-xs text-ink-500">{contributor.subject}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-right
                  ${currentPage === item.id
                    ? 'bg-sand-900/60 text-sand-400 font-medium border border-sand-800/50'
                    : 'text-ink-400 hover:bg-ink-800 hover:text-ink-200'
                  }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Stats Footer */}
      <div className="p-4 border-t border-ink-800">
        <p className="text-sm font-medium text-sand-400 mb-3">
          {subject?.nameAr || 'لم يتم تحديد المادة'}
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-ink-500 mb-4">
          <span>{units.length} وحدات</span>
          <span>{lessons.length} دروس</span>
          <span>{concepts.length} مفاهيم</span>
          <span>{feedItems.length} عناصر تغذية</span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-xs text-ink-600 hover:text-red-400 transition-colors py-2 text-right"
        >
          تسجيل الخروج ←
        </button>
      </div>
    </aside>
  );
}
