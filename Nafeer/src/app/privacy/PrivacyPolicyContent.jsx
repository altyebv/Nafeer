'use client';

import Link from 'next/link';
import { useState } from 'react';

function headingId(title) {
  return title
    .replace(/<a id="[^"]+"><\/a>/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');
}

function getSections(content) {
  const sections = [];

  for (const line of content.split(/\r?\n/)) {
    const heading = line.trim().match(/^(#{2,3})\s+(.+)$/);
    if (!heading) continue;

    const title = heading[2].replace(/<a id="[^"]+"><\/a>/g, '').trim();
    if (heading[1].length === 2 && /^\d+\./.test(title)) {
      sections.push({ id: headingId(title), title, subsections: [] });
    } else if (heading[1].length === 3 && sections.length > 0) {
      sections[sections.length - 1].subsections.push({
        id: headingId(title),
        title,
      });
    }
  }

  return sections;
}

function getPolicyMetadata(content, isArabic) {
  const fields = isArabic
    ? [
      { key: 'تاريخ السريان', label: 'تاريخ السريان' },
      { key: 'الإصدار', label: 'الإصدار' },
      { key: 'النطاق', label: 'النطاق' },
    ]
    : [
      { key: 'Effective Date', label: 'Effective date' },
      { key: 'Version', label: 'Version' },
      { key: 'Scope', label: 'Scope' },
    ];

  return fields.map(({ key, label }) => {
    const value = content.match(new RegExp(String.raw`^\*\*${key}:\*\*\s*(.+)$`, 'm'))?.[1];
    return { label, value };
  }).filter(({ value }) => value);
}

function renderInline(text, keyPrefix) {
  const tokenPattern = /(<a id="[^"]+"><\/a>|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`)/g;
  const nodes = [];
  let lastIndex = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    const index = match.index;
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${tokenIndex++}`;

    if (token.startsWith('<a id=')) {
      nodes.push(<span id={token.match(/id="([^"]+)"/)[1]} key={key} />);
    } else if (match[2]) {
      const href = match[3];
      const isExternal = href.startsWith('https://');
      const isSafe = isExternal || href.startsWith('mailto:') || href.startsWith('#');
      nodes.push(
        isSafe
          ? (
            <a
              href={href}
              key={key}
              className="text-[var(--accent)] underline underline-offset-2"
              {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {match[2]}
            </a>
          )
          : match[2],
      );
    } else if (match[4]) {
      nodes.push(<strong key={key} className="font-semibold text-[var(--text-primary)]">{match[4]}</strong>);
    } else {
      nodes.push(<code key={key} className="rounded bg-[var(--bg-primary)] px-1.5 py-0.5 text-sm">{match[5]}</code>);
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function MarkdownContent({ content }) {
  const lines = content.split(/\r?\n/);
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(heading[1].length, 3);
      const id = headingId(heading[2]);
      const HeadingTag = `h${level}`;
      const headingClass = level === 1
        ? 'mb-2 text-3xl font-semibold leading-tight'
        : level === 2
          ? 'mt-10 border-b border-[var(--border-mid)] pb-3 text-2xl font-semibold leading-snug'
          : 'mt-7 text-xl font-semibold leading-snug';

      blocks.push(
        <HeadingTag
          id={id || undefined}
          key={`heading-${index}`}
          className={headingClass}
        >
          {renderInline(heading[2], `heading-${index}`)}
        </HeadingTag>,
      );
      index += 1;
      continue;
    }

    if (/^(---+|\*\*\*+|___+)$/.test(line)) {
      blocks.push(<hr key={`rule-${index}`} className="my-8 border-[var(--border-mid)]" />);
      index += 1;
      continue;
    }

    const listMatch = line.match(/^([-*])\s+(.+)$/) || line.match(/^(\d+)\.\s+(.+)$/);
    if (listMatch) {
      const ordered = /^\d/.test(listMatch[1]);
      const items = [];

      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(
          ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/,
        );
        if (!itemMatch) break;
        items.push(itemMatch[1]);
        index += 1;
      }

      const ListTag = ordered ? 'ol' : 'ul';
      blocks.push(
        <ListTag
          key={`list-${index}`}
          className={`space-y-2 ps-6 leading-8 text-[var(--text-secondary)] ${ordered ? 'list-decimal' : 'list-disc'}`}
        >
          {items.map((item, itemIndex) => (
            <li key={`list-${index}-${itemIndex}`}>{renderInline(item, `list-${index}-${itemIndex}`)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim()) {
      paragraph.push(lines[index].trim());
      index += 1;
    }

    blocks.push(
      <p key={`paragraph-${index}`} className="leading-8 text-[var(--text-secondary)]">
        {renderInline(paragraph.join(' '), `paragraph-${index}`)}
      </p>,
    );
  }

  return <div className="space-y-4">{blocks}</div>;
}

export default function PrivacyPolicyContent({ arabic, english }) {
  const [language, setLanguage] = useState('ar');
  const isArabic = language === 'ar';
  const content = isArabic ? arabic : english;
  const sections = getSections(content);
  const metadata = getPolicyMetadata(content, isArabic);
  const contentsLabel = isArabic ? 'محتويات السياسة' : 'On this page';

  return (
    <main
      lang={isArabic ? 'ar' : 'en'}
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[var(--bg-primary)] px-4 py-8 font-arabic text-[var(--text-primary)] sm:px-6 sm:py-12"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            <span aria-hidden="true">{isArabic ? '←' : '→'}</span>
            {isArabic ? 'العودة إلى الرئيسية' : 'Back to home'}
          </Link>

          <div
            aria-label={isArabic ? 'اختر لغة سياسة الخصوصية' : 'Choose privacy policy language'}
            className="inline-flex rounded-xl border border-[var(--border-mid)] bg-[var(--bg-card)] p-1"
            role="group"
          >
            {[
              { code: 'ar', label: 'العربية' },
              { code: 'en', label: 'English' },
            ].map(({ code, label }) => (
              <button
                key={code}
                type="button"
                aria-pressed={language === code}
                onClick={() => setLanguage(code)}
                className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors ${
                  language === code
                    ? 'bg-[var(--accent)] text-[var(--bg-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="mb-6 rounded-2xl border border-[var(--border-mid)] bg-[var(--bg-card)] px-5 py-5 sm:px-7">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {isArabic ? 'بشير · الخصوصية والبيانات' : 'Basheer · Privacy & data'}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {metadata.map(({ label, value }) => (
              <div key={label} className="min-w-0">
                <p className="mb-1 text-xs text-[var(--text-muted)]">{label}</p>
                <p className="text-sm leading-6 text-[var(--text-primary)]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav
              aria-label={contentsLabel}
              className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-[var(--border-mid)] bg-[var(--bg-card)] p-5"
            >
              <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{contentsLabel}</h2>
              <SectionLinks sections={sections} />
            </nav>
          </aside>

          <details className="group rounded-xl border border-[var(--border-mid)] bg-[var(--bg-card)] lg:hidden">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
              <span className="flex items-center justify-between gap-3">
                {contentsLabel}
                <span aria-hidden="true" className="text-[var(--text-muted)] transition-transform group-open:rotate-180">⌄</span>
              </span>
            </summary>
            <nav aria-label={contentsLabel} className="border-t border-[var(--border-mid)] px-4 py-3">
              <SectionLinks sections={sections} onNavigate={(event) => {
                if (event.target.closest('a')) event.currentTarget.closest('details').open = false;
              }} />
            </nav>
          </details>

          <article className="min-w-0 rounded-2xl border border-[var(--border-mid)] bg-[var(--bg-card)] px-5 py-7 shadow-sm sm:px-10 sm:py-10">
            <MarkdownContent content={content} />
          </article>
        </div>
      </div>
    </main>
  );
}

function SectionLinks({ sections, onNavigate }) {
  return (
    <ol className="space-y-1.5">
      {sections.map(({ id, title, subsections }) => (
        <li key={id}>
          <a
            href={`#${id}`}
            onClick={onNavigate}
            className="block rounded-lg px-2.5 py-2 text-sm leading-6 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-primary)] hover:text-[var(--accent)]"
          >
            {title}
          </a>
          {subsections.length > 0 && (
            <ol className="mb-1 ms-3 space-y-0.5 border-s-[1px] border-[var(--border-mid)] ps-2">
              {subsections.map((subsection) => (
                <li key={subsection.id}>
                  <a
                    href={`#${subsection.id}`}
                    onClick={onNavigate}
                    className="block rounded-md px-2 py-1.5 text-xs leading-5 text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
                  >
                    {subsection.title}
                  </a>
                </li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ol>
  );
}
