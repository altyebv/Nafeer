'use client';
import { useState } from 'react';
import { HIGHLIGHT_STYLES } from '@/shared/constants';
import FormulaPreview from '@/components/editor/shared/FormulaPreview';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  FileText,
  Info,
  Lightbulb,
  PartyPopper,
  Pencil,
  Save,
  Sparkles,
  Target,
  Zap,
  X,
} from 'lucide-react';

const LEARNING_ICONS = {
  UNDERSTANDING: Brain,
  MEMORIZATION: Save,
  HYBRID: Zap,
};

const HIGHLIGHT_ICONS = {
  DEFINITION: BookOpen,
  WARNING: AlertTriangle,
  NOTE: Info,
  TIP: Lightbulb,
};

// ─── Phone frame preview — Android Basheer mocker ────────────────────────────
export default function LessonPreviewModal({ lesson, sections, blocks, questions, onClose }) {
  // Group sections by partIndex, sorted by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const partsMap = sortedSections.reduce((acc, s) => {
    const p = s.partIndex ?? 0;
    if (!acc[p]) acc[p] = [];
    acc[p].push(s);
    return acc;
  }, {});
  const partKeys = Object.keys(partsMap).map(Number).sort((a, b) => a - b);

  const [activePart, setActivePart] = useState(partKeys[0] ?? 0);
  const partNames = ['الجزء الأول', 'الجزء الثاني', 'الجزء الثالث', 'الجزء الرابع'];

  const activeSections = partsMap[activePart] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-sm" onClick={onClose} />

      {/* Outer wrapper — label + phone */}
      <div className="relative flex flex-col items-center gap-4">

        {/* Header label */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-ink-600 font-arabic">معاينة — بشير Android</span>
          <button
            onClick={onClose}
            className="text-ink-600 hover:text-ink-300 transition-colors text-sm px-3 py-1 rounded-lg hover:bg-ink-800 font-arabic"
          >
            <X size={13} strokeWidth={1.9} className="inline ml-1" /> إغلاق
          </button>
        </div>

        {/* Phone frame */}
        <div
          className="relative flex flex-col overflow-hidden"
          style={{
            width: 360,
            height: 'min(780px, 88vh)',
            background: '#0e0c09',
            borderRadius: 40,
            border: '3px solid #2a2520',
            boxShadow: '0 0 0 1px #1a1713, 0 40px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-4 pb-1 shrink-0" style={{ background: '#0e0c09' }}>
            <span className="text-[11px] text-white/60 font-mono">10:35</span>
            <div className="w-20 h-5 rounded-full bg-black absolute top-2 left-1/2 -translate-x-1/2" />
            <div className="flex items-center gap-1">
              <SignalIcon />
              <WifiIcon />
              <BatteryIcon />
            </div>
          </div>

          {/* App top bar */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0 border-b" style={{ borderColor: '#1a1713', background: '#0e0c09' }}>
            <button className="text-white/60 text-sm">←</button>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold font-arabic truncate">{lesson.title}</p>
              <p className="text-white/40 text-[10px] font-arabic">{lesson.estimatedMinutes} دقيقة</p>
            </div>
            {/* Progress pills */}
            <div className="flex gap-1">
              {partKeys.map((p) => (
                <div
                  key={p}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: p === activePart ? 20 : 8,
                    background: p === activePart ? '#d4891e' : '#2a2520',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Part tabs — only if multiple parts */}
          {partKeys.length > 1 && (
            <div className="flex border-b shrink-0" style={{ borderColor: '#1a1713', background: '#0e0c09' }}>
              {partKeys.map((p, pi) => (
                <button
                  key={p}
                  onClick={() => setActivePart(p)}
                  className="flex-1 py-2.5 text-xs font-arabic transition-colors"
                  style={{
                    color: p === activePart ? '#d4891e' : '#4a4540',
                    borderBottom: p === activePart ? '2px solid #d4891e' : '2px solid transparent',
                  }}
                >
                  {partNames[pi] || `الجزء ${pi + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {activeSections.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <FileText size={34} strokeWidth={1.5} className="text-white/20" />
                <span className="text-white/30 text-xs font-arabic">لا يوجد محتوى في هذا الجزء</span>
              </div>
            )}

            {activeSections.map((section) => {
              const sectionBlocks = blocks
                .filter((b) => b.sectionId === section.id)
                .sort((a, b) => a.order - b.order);
              const checkpoint = questions.find((q) => q.sectionId === section.id && q.isCheckpoint);

              return (
                <div key={section.id}>
                  {/* Section header */}
                  <SectionHeader title={section.title} type={section.learningType} />

                  {/* Blocks */}
                  <div className="px-4 space-y-3 py-2">
                    {sectionBlocks.map((block) => (
                      <BlockPreview key={block.id} block={block} />
                    ))}
                    {sectionBlocks.length === 0 && (
                      <div className="py-4 text-center text-white/20 text-xs font-arabic">قسم فارغ</div>
                    )}
                  </div>

                  {/* Checkpoint card */}
                  {checkpoint && <CheckpointPreview question={checkpoint} />}
                </div>
              );
            })}

            {/* Lesson complete card */}
            {activePart === partKeys[partKeys.length - 1] && activeSections.length > 0 && (
              <LessonCompleteCard lesson={lesson} />
            )}

            <div className="h-8" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-ink-700 font-arabic">
          <span className="inline-flex items-center gap-1"><Zap size={11} strokeWidth={1.9} /> تفاعلي</span>
          <span className="inline-flex items-center gap-1"><Brain size={11} strokeWidth={1.9} /> فهم · <Save size={11} strokeWidth={1.9} /> حفظ</span>
          <span className="inline-flex items-center gap-1"><Target size={11} strokeWidth={1.9} /> نقطة تحقق</span>
        </div>
      </div>
    </div>
  );
}

// ─── Section header (matches Android SectionHeader.kt) ────────────────────────
function SectionHeader({ title, type }) {
  const typeColor = type === 'MEMORIZATION' ? '#7c6fc4' : type === 'HYBRID' ? '#d4891e' : '#5b8dd9';
  const Icon = LEARNING_ICONS[type] || Brain;
  return (
    <div className="flex items-center gap-2 px-4 py-3 mt-2" style={{ borderBottom: '1px solid #1a1713' }}>
      <div className="w-0.5 h-4 rounded-full" style={{ background: typeColor }} />
      <span className="text-white/80 text-sm font-semibold font-arabic">{title}</span>
      <span className="text-[10px] mr-auto" style={{ color: typeColor }}>
        <Icon size={13} strokeWidth={1.9} />
      </span>
    </div>
  );
}

// ─── Block renderers ──────────────────────────────────────────────────────────
function BlockPreview({ block }) {
  switch (block.type) {

    case 'TEXT':
      return (
        <p className="text-white/85 text-sm font-arabic leading-relaxed">
          {block.content || <span className="text-white/20">نص فارغ</span>}
        </p>
      );

    case 'HEADING': {
      const level = block.metadata?.level ?? 2;
      return (
        <p className={`text-white font-bold font-arabic ${level === 2 ? 'text-lg' : 'text-base'}`}
          style={{ color: '#d4891e' }}>
          {block.content || `عنوان ${level === 2 ? 'رئيسي' : 'فرعي'}`}
        </p>
      );
    }

    case 'IMAGE':
    case 'GIF': {
      const markers = Array.isArray(block.metadata?.markers) ? block.metadata.markers : [];
      return (
        <div className="rounded-xl overflow-hidden" style={{ background: '#0e0c09' }}>
          {block.content ? (
            <div className="relative select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.content}
                alt={block.metadata?.alt || ''}
                className="w-full h-auto block"
                draggable={false}
              />
              {/* Marker pin overlay — read-only */}
              {markers.map((marker, idx) => {
                const hasLabel = Boolean(marker.label?.trim());
                return (
                  <div
                    key={marker.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${marker.x * 100}%`,
                      top:  `${marker.y * 100}%`,
                      transform: 'translate(-50%, -100%)',
                      zIndex: 10,
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shadow-lg mb-0.5 bg-sand-500/90 text-ink-950 border border-sand-400 backdrop-blur-sm">
                        {hasLabel ? marker.label : (idx + 1)}
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-3 bg-sand-400" />
                        <div className="w-2.5 h-2.5 rounded-full border-2 bg-sand-400 border-sand-300 shadow" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              {block.type === 'GIF'
                ? <Zap size={26} strokeWidth={1.6} className="text-white/20" />
                : <FileText size={26} strokeWidth={1.6} className="text-white/20" />}
              <span className="text-white/30 text-xs font-mono">لم يتم اختيار صورة</span>
            </div>
          )}
          {/* Marker count hint */}
          {markers.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[10px] inline-flex items-center gap-1" style={{ color: '#d4891e' }}>
                <Sparkles size={11} strokeWidth={1.8} /> {markers.length} علامة تفاعلية
              </span>
            </div>
          )}
          {block.caption && (
            <p className="text-white/50 text-xs font-arabic text-center px-3 py-2">{block.caption}</p>
          )}
        </div>
      );
    }

    case 'FORMULA':
      return (
        <div className="rounded-xl px-4 py-4 text-center" style={{ background: '#1a1713' }}>
          <FormulaPreview
            latex={block.content || ''}
            displayMode={block.metadata?.displayMode !== true}
            rtlMath={true}
          />
          {!block.content && (
            <p className="font-mono text-xs mt-1" style={{ color: '#5c5648' }}>معادلة</p>
          )}
        </div>
      );

    case 'HIGHLIGHT_BOX': {
      const style  = block.metadata?.style ?? 'NOTE';
      const colors = {
        DEFINITION: { bg: '#0f172a', border: '#3b82f6', text: '#93c5fd' },
        WARNING:    { bg: '#1f0a0a', border: '#ef4444', text: '#fca5a5' },
        NOTE:       { bg: '#1c1200', border: '#f59e0b', text: '#fcd34d' },
        TIP:        { bg: '#0a1f0a', border: '#22c55e', text: '#86efac' },
      };
      const c   = colors[style] || colors.NOTE;
      const cfg = HIGHLIGHT_STYLES[style];
      const Icon = HIGHLIGHT_ICONS[style] || Info;
      return (
        <div className="rounded-xl p-3" style={{ background: c.bg, borderRight: `3px solid ${c.border}` }}>
          <p className="text-xs mb-1.5 font-arabic" style={{ color: c.text }}>
            <Icon size={12} strokeWidth={1.9} className="inline ml-1" /> {cfg?.label}
          </p>
          <p className="text-sm font-arabic text-white/80 leading-relaxed">
            {block.content || '…'}
          </p>
        </div>
      );
    }

    case 'EXAMPLE': {
      const interactive = block.metadata?.interactive ?? false;
      const steps       = block.metadata?.steps ?? [];
      return (
        <div className="rounded-xl overflow-hidden" style={{ background: '#0a1f1c', border: '1px solid #134e4a' }}>
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid #134e4a' }}>
            <span className="text-xs inline-flex items-center gap-1" style={{ color: '#2dd4bf' }}><Pencil size={12} strokeWidth={1.9} /> مثال</span>
            {interactive && <span className="text-[10px] px-1.5 py-0.5 rounded font-arabic inline-flex items-center gap-1" style={{ background: '#134e4a', color: '#5eead4' }}><Zap size={10} strokeWidth={1.9} /> تفاعلي</span>}
          </div>
          <div className="p-3 space-y-2">
            {interactive && steps.length > 0 ? (
              steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0"
                    style={{ background: '#134e4a', color: '#5eead4' }}>{i + 1}</div>
                  <p className="text-sm font-arabic text-white/80">{step || '…'}</p>
                </div>
              ))
            ) : (
              <p className="text-sm font-arabic text-white/80 leading-relaxed">{block.content || '…'}</p>
            )}
          </div>
        </div>
      );
    }

    case 'TIP':
      return (
        <div className="rounded-xl p-3" style={{ background: '#1c0f00', borderRight: '3px solid #f97316' }}>
          <p className="text-xs mb-1.5 font-arabic" style={{ color: '#fb923c' }}>◈ نصيحة</p>
          <p className="text-sm font-arabic text-white/80 leading-relaxed">{block.content || '…'}</p>
        </div>
      );

    case 'LIST': {
      const style = block.metadata?.style ?? 'BULLET';
      const items = (block.content || '').split('\n').filter(Boolean);
      return (
        <div className="space-y-1.5">
          {items.length === 0 && <p className="text-white/20 text-xs font-arabic">قائمة فارغة</p>}
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-sm shrink-0 mt-0.5" style={{ color: '#d4891e' }}>
                {style === 'NUMBERED' ? `${i + 1}.` : '•'}
              </span>
              <p className="text-sm font-arabic text-white/80">{item}</p>
            </div>
          ))}
        </div>
      );
    }

    case 'TABLE': {
      let parsed = null;
      try { parsed = JSON.parse(block.content); } catch { /* ignore */ }
      if (!parsed?.headers) return <p className="text-white/20 text-xs font-arabic text-center py-3">جدول</p>;
      return (
        <div className="rounded-xl overflow-hidden text-xs" style={{ border: '1px solid #2a2520' }}>
          <div className="grid font-semibold" style={{ gridTemplateColumns: `repeat(${parsed.headers.length}, 1fr)`, background: '#1a1713' }}>
            {parsed.headers.map((h, i) => (
              <div key={i} className="px-2 py-1.5 text-white/70 font-arabic border-r last:border-r-0" style={{ borderColor: '#2a2520' }}>{h}</div>
            ))}
          </div>
          {(parsed.rows || []).map((row, ri) => (
            <div key={ri} className="grid" style={{ gridTemplateColumns: `repeat(${parsed.headers.length}, 1fr)`, background: ri % 2 ? '#0f0d0a' : '#0e0c09' }}>
              {row.map((cell, ci) => (
                <div key={ci} className="px-2 py-1.5 text-white/60 font-arabic border-r last:border-r-0" style={{ borderColor: '#1a1713' }}>{cell}</div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    case 'QUOTE':
      return (
        <div className="pr-3" style={{ borderRight: '3px solid #4a4540' }}>
          <p className="text-sm italic font-arabic text-white/50 leading-relaxed">{block.content || '…'}</p>
        </div>
      );

    case 'DIVIDER':
      return <div className="h-px" style={{ background: '#2a2520' }} />;

    default:
      return <p className="text-white/30 text-xs font-mono">[{block.type}]</p>;
  }
}

// ─── Checkpoint card ──────────────────────────────────────────────────────────
function CheckpointPreview({ question }) {
  return (
    <div className="mx-4 my-3 rounded-xl p-3" style={{ background: '#0f1620', border: '1px solid #1e3a5f' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs inline-flex items-center gap-1" style={{ color: '#60a5fa' }}>
          <Target size={12} strokeWidth={1.9} /> نقطة تحقق
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-arabic" style={{ background: '#1e3a5f', color: '#93c5fd' }}>
          {question.type}
        </span>
      </div>
      <p className="text-sm font-arabic text-white/80 leading-relaxed mb-3">{question.textAr || 'السؤال'}</p>
      <div className="space-y-1.5">
        {(() => {
          let opts = [];
          try { opts = JSON.parse(question.options || '[]'); } catch { opts = []; }
          return opts.slice(0, 4).map((opt, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: '#1a1713' }}>
              <div className="w-4 h-4 rounded-full border flex-shrink-0" style={{ borderColor: '#3b4a5a' }} />
              <span className="text-xs font-arabic text-white/60">{opt}</span>
            </div>
          ));
        })()}
        {!question.options && (
          <p className="text-xs text-white/30 font-arabic text-center py-1">لا توجد خيارات</p>
        )}
      </div>
      <button className="w-full mt-3 py-2 rounded-lg text-xs font-semibold font-arabic transition-all"
        style={{ background: '#1e3a5f', color: '#60a5fa' }}>
        تحقق
      </button>
    </div>
  );
}

// ─── Lesson complete card ─────────────────────────────────────────────────────
function LessonCompleteCard({ lesson }) {
  return (
    <div className="mx-4 my-4 rounded-2xl p-4 text-center" style={{ background: 'linear-gradient(135deg, #1c1200, #0e0c09)', border: '1px solid #2a2215' }}>
      <PartyPopper size={34} strokeWidth={1.6} className="mx-auto mb-2" style={{ color: '#d4891e' }} />
      <p className="text-white font-semibold font-arabic mb-1">أتممت الدرس!</p>
      <p className="text-white/50 text-xs font-arabic mb-3">{lesson.title}</p>
      {lesson.metadata?.forwardPull && (
        <p className="text-xs font-arabic mb-3 px-2" style={{ color: '#d4891e' }}>
          {lesson.metadata.forwardPull}
        </p>
      )}
      <button className="px-6 py-2.5 rounded-xl text-sm font-semibold font-arabic w-full"
        style={{ background: '#d4891e', color: '#0e0c09' }}>
        التالي
      </button>
    </div>
  );
}

// ─── Phone chrome icons ───────────────────────────────────────────────────────
function SignalIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
      <rect x="0" y="6" width="2" height="4" rx="0.5" fill="white" fillOpacity="0.6" />
      <rect x="3" y="4" width="2" height="6" rx="0.5" fill="white" fillOpacity="0.6" />
      <rect x="6" y="2" width="2" height="8" rx="0.5" fill="white" fillOpacity="0.6" />
      <rect x="9" y="0" width="2" height="10" rx="0.5" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
      <path d="M7 8.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" fill="white" fillOpacity="0.6" />
      <path d="M4 6a4.2 4.2 0 0 1 6 0" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M1.5 3.5a7.5 7.5 0 0 1 11 0" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
      <rect x="0.5" y="0.5" width="18" height="11" rx="2.5" stroke="white" strokeOpacity="0.5" />
      <rect x="2" y="2" width="12" height="8" rx="1.5" fill="white" fillOpacity="0.7" />
      <path d="M20 4v4a2 2 0 0 0 0-4Z" fill="white" fillOpacity="0.4" />
    </svg>
  );
}
