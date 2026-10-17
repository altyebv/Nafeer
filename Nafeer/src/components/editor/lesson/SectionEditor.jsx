'use client';
import { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronLeft, GripVertical, Lightbulb, Plus } from 'lucide-react';

import { useDataStore } from '@/store/dataStore';
import { useShallow } from 'zustand/react/shallow';
import { useAtlasSync } from '@/hooks/useAtlasSync';
import { LEARNING_TYPES, LEARNING_TYPE_CONFIG, SECTION_KIND_CONFIG, BLOCK_TYPE_CONFIG } from '@/shared/constants';
import { Badge, Segmented, Select, cx } from '@/components/ui';
import BlockEditor    from '@/components/editor/blocks/BlockEditor';
import AddBlockMenu   from '@/components/editor/blocks/AddBlockMenu';
import ConceptLinker  from '@/components/editor/shared/ConceptLinker';
import DeleteButton   from '@/components/editor/shared/DeleteButton';
import { ConflictCard, UnsavedBar, UnsavedDot, useConflict } from '@/components/editor/lesson/SyncMarks';

// ─── SectionEditor ────────────────────────────────────────────────────────────
// DS2 step 4 (canvas board EdContentTab). The header says what the section is
// in words — its role (shown to the student above the title), its purpose
// (فهم / حفظ, which decides the lab and the feed), its part — instead of
// three unlabelled emoji toggles. Blocks are added from one grouped menu,
// opened by the button under the last block or by typing "/" in an empty
// text block.

// The leading edge carries the purpose, in theme-aware status colours.
const PURPOSE_EDGE = {
  UNDERSTANDING: 'border-s-info',
  MEMORIZATION:  'border-s-special',
  HYBRID:        'border-s-accent',
};

const PURPOSE_ITEMS = Object.keys(LEARNING_TYPES).map((key) => ({
  id: key, label: LEARNING_TYPE_CONFIG[key].label, hint: LEARNING_TYPE_CONFIG[key].hint,
}));

// ─── SortableBlockItem ────────────────────────────────────────────────────────
function SortableBlockItem({ block, index, count, subjectId, lessonId, unitId, sectionId, onMove, onDuplicate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const conflict = useConflict(lessonId, block.id);

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.35 : 1,
    position:   'relative',
    zIndex:     isDragging ? 0 : 'auto',
  };

  // data-sync-id lets the header's "go to conflict" and the outline scroll here.
  return (
    <div ref={setNodeRef} style={style} data-sync-id={block.id} data-block-type={block.type} className="space-y-2">
      {conflict && <ConflictCard conflict={conflict} />}
      <div className={cx('relative rounded-card', conflict && 'ring-1 ring-warn-border')}>
        <UnsavedBar show={!!block._dirty && !conflict} />
        <BlockEditor
          block={block}
          subjectId={subjectId}
          dragHandleProps={{ ...attributes, ...listeners }}
          lessonId={lessonId}
          unitId={unitId}
          sectionId={sectionId}
          canMoveUp={index > 0}
          canMoveDown={index < count - 1}
          onMove={onMove}
          onDuplicate={onDuplicate}
        />
      </div>
    </div>
  );
}

export default function SectionEditor({ section, index = 0, maxPart = 0, subjectId, lessonId, unitId }) {
  const { blocks, concepts, updateSection, deleteSection, addBlock, updateBlock, reorderBlocks } = useDataStore(
    useShallow((s) => ({
      blocks: s.blocks, concepts: s.concepts, updateSection: s.updateSection, deleteSection: s.deleteSection,
      addBlock: s.addBlock, updateBlock: s.updateBlock, reorderBlocks: s.reorderBlocks,
    })),
  );
  const { deleteSection: atlasDeleteSection } = useAtlasSync();
  const conflict = useConflict(lessonId, section.id);

  const [isEditingTitle, setIsEditingTitle] = useState(!section.title || /^قسم \d+$/.test(section.title.trim()));
  // null · { mode: 'append' } · { mode: 'replace', blockId } — "/" in an empty text block
  const [menu, setMenu] = useState(null);
  const [showConceptLinker, setShowConceptLinker] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState(null);

  const sectionBlocks = blocks.filter((b) => b.sectionId === section.id).sort((a, b) => a.order - b.order);
  const linkedConcepts = concepts.filter((c) => section.conceptIds?.includes(c.id));
  const purpose = section.learningType || 'UNDERSTANDING';
  const kind = section.kind || 'GENERAL';
  const partIndex = section.partIndex ?? 0;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDelete = () => {
    deleteSection(section.id);
    atlasDeleteSection(section.id);
  };

  const pickType = (type) => {
    if (menu?.mode === 'replace') {
      updateBlock(menu.blockId, { type, metadata: BLOCK_TYPE_CONFIG[type]?.defaultMeta ?? null });
    } else {
      addBlock({ sectionId: section.id, type, content: '', conceptRef: null });
    }
    setMenu(null);
  };

  // "/" typed into an empty text block opens the menu to replace that block.
  const onBodyKeyDown = (e) => {
    if (e.key !== '/' || e.target.tagName !== 'TEXTAREA' || e.target.value !== '') return;
    const host = e.target.closest('[data-sync-id]');
    if (!host || host.dataset.blockType !== 'TEXT') return;
    e.preventDefault();
    setMenu({ mode: 'replace', blockId: host.dataset.syncId });
  };

  const moveBlock = (id, delta) => {
    const ids = sectionBlocks.map((b) => b.id);
    const from = ids.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return;
    reorderBlocks(section.id, arrayMove(ids, from, to));
  };

  const duplicateBlock = (block) => {
    const id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    addBlock({ id, sectionId: section.id, type: block.type, content: block.content, caption: block.caption ?? null, conceptRef: block.conceptRef ?? null, metadata: block.metadata ?? null });
    const ids = sectionBlocks.map((b) => b.id);
    ids.splice(ids.indexOf(block.id) + 1, 0, id);
    reorderBlocks(section.id, ids);
  };

  const setPartIndex = (delta) => {
    const next = Math.max(0, Math.min(maxPart + 1, partIndex + delta));
    updateSection(section.id, { partIndex: next });
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveBlockId(null);
    if (!over || active.id === over.id) return;
    const ids = sectionBlocks.map((b) => b.id);
    const oldIdx = ids.indexOf(active.id);
    const newIdx = ids.indexOf(over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    reorderBlocks(section.id, arrayMove(ids, oldIdx, newIdx));
  };

  const activeBlock = activeBlockId ? sectionBlocks.find((b) => b.id === activeBlockId) : null;
  const Chevron = collapsed ? ChevronLeft : ChevronDown;
  const titleId = `section-title-${section.id}`;

  return (
    <section
      data-sync-id={section.id}
      aria-labelledby={titleId}
      className={cx('bg-raised rounded-card border border-s-4 overflow-hidden scroll-mt-40', PURPOSE_EDGE[purpose], conflict ? 'border-warn-border' : 'border-line')}
    >
      {/* ── Header: what this section is ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 px-4 py-3 bg-sunken border-b border-line">
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="shrink-0 text-fg-subtle cursor-grab" aria-hidden="true" />
          <button type="button" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed}
            aria-label={collapsed ? 'افتح القسم' : 'طيّ القسم'}
            className="w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-control text-fg-muted hover:bg-hover touch-target">
            <Chevron size={16} />
          </button>

          <div className="flex-1 min-w-0 flex flex-col">
            <span className="t-caption text-fg-subtle">
              القسم {index + 1}{kind !== 'GENERAL' ? ` · ${SECTION_KIND_CONFIG[kind].label}` : ''}
            </span>
            {isEditingTitle ? (
              <input
                id={titleId}
                type="text"
                value={section.title}
                placeholder="عنوان القسم كما يراه الطالب"
                aria-label="عنوان القسم"
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                className="h-9 px-2 -mx-2 rounded-control bg-page border border-line-accent t-title text-fg-strong focus:outline-none"
                autoFocus
              />
            ) : (
              <button id={titleId} type="button" onClick={() => setIsEditingTitle(true)} title="انقر لتعديل العنوان"
                className="text-start t-title text-fg-strong hover:text-fg-accent truncate">
                {section.title}
              </button>
            )}
          </div>

          <UnsavedDot show={!!section._dirty && !conflict} />
          <span className="t-caption text-fg-subtle tabular-nums shrink-0">
            {sectionBlocks.length ? `${sectionBlocks.length} عناصر` : 'فارغ'}
          </span>
          <DeleteButton onDelete={handleDelete} />
        </div>

        {!collapsed && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 ps-9">
            <span className="flex items-center gap-2">
              <span className="t-caption text-fg-muted">الغرض</span>
              <Segmented label="غرض القسم" size="sm" value={purpose}
                onChange={(v) => updateSection(section.id, { learningType: v })} items={PURPOSE_ITEMS} />
            </span>
            <label className="flex items-center gap-2">
              <span className="t-caption text-fg-muted">الدور</span>
              <Select value={kind} onChange={(e) => updateSection(section.id, { kind: e.target.value })}
                title="يظهر للطالب فوق عنوان القسم" className="h-8 w-36">
                {Object.entries(SECTION_KIND_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </Select>
            </label>
            {maxPart > 0 && (
              <span className="flex items-center gap-1">
                <span className="t-caption text-fg-muted">الجزء</span>
                <button type="button" onClick={() => setPartIndex(-1)} disabled={partIndex === 0} aria-label="انقل للجزء السابق"
                  className="w-7 h-7 rounded-control text-fg-muted hover:bg-hover disabled:opacity-30 touch-target">‹</button>
                <span className="t-label tabular-nums text-fg w-4 text-center">{partIndex + 1}</span>
                <button type="button" onClick={() => setPartIndex(1)} aria-label="انقل للجزء التالي"
                  className="w-7 h-7 rounded-control text-fg-muted hover:bg-hover touch-target">›</button>
              </span>
            )}
          </div>
        )}
      </div>

      {conflict && <div className="px-4 pt-3"><ConflictCard conflict={conflict} /></div>}

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="p-4 space-y-3" onKeyDown={onBodyKeyDown}>
          <div className="flex items-center gap-2 flex-wrap">
            {linkedConcepts.map((c) => (
              <Badge key={c.id} tone="accent" size="sm" icon={Lightbulb}>{c.titleAr}</Badge>
            ))}
            <button type="button" onClick={() => setShowConceptLinker(!showConceptLinker)}
              className="t-caption text-fg-muted hover:text-fg-accent">
              {showConceptLinker ? 'إغلاق' : linkedConcepts.length ? '+ مفهوم آخر' : '+ ربط مفهوم'}
            </button>
          </div>
          {showConceptLinker && <ConceptLinker sectionId={section.id} linkedConceptIds={section.conceptIds || []} />}

          {sectionBlocks.length === 0 && !menu && (
            <div className="flex flex-col gap-3 p-4 rounded-card border border-dashed border-line-strong">
              <span className="t-label text-fg-muted">ابدأ القسم بفقرة تشرح الفكرة، ثم أضف صورة أو مثالاً.</span>
              <span className="flex gap-2">
                <button type="button" onClick={() => pickType('TEXT')}
                  className="h-8 px-3 rounded-control bg-accent text-fg-on-accent t-label font-semibold">+ فقرة</button>
                <button type="button" onClick={() => setMenu({ mode: 'append' })}
                  className="h-8 px-3 rounded-control border border-line-strong text-fg t-label hover:bg-hover">عنصر آخر…</button>
              </span>
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter}
            onDragStart={({ active }) => setActiveBlockId(active.id)} onDragEnd={handleDragEnd} onDragCancel={() => setActiveBlockId(null)}>
            <SortableContext items={sectionBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {sectionBlocks.map((block, i) => (
                  <SortableBlockItem key={block.id} block={block} index={i} count={sectionBlocks.length}
                    subjectId={subjectId} lessonId={lessonId} unitId={unitId} sectionId={section.id}
                    onMove={(delta) => moveBlock(block.id, delta)} onDuplicate={() => duplicateBlock(block)} />
                ))}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
              {activeBlock && (
                <div className="opacity-90 shadow-overlay rounded-card ring-1 ring-line-accent pointer-events-none">
                  <BlockEditor block={activeBlock} subjectId={subjectId} dragHandleProps={{}}
                    lessonId={lessonId} unitId={unitId} sectionId={section.id} />
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {menu ? (
            <AddBlockMenu onSelect={pickType} onClose={() => setMenu(null)}
              title={menu.mode === 'replace' ? 'حوّل الفقرة الفارغة إلى…' : 'إضافة عنصر'} />
          ) : sectionBlocks.length > 0 && (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMenu({ mode: 'append' })}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-control border border-dashed border-line-strong text-fg-muted hover:text-fg-accent hover:border-line-accent t-label">
                <Plus size={14} /> إضافة عنصر
              </button>
              <span className="t-caption text-fg-subtle hidden sm:inline">أو اكتب <kbd className="px-1 rounded-chip border border-line t-caption">/</kbd> في فقرة فارغة</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
