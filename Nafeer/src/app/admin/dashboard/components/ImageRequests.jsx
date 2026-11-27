'use client';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card } from '@/components/ui';
import { formatRelative } from '@/lib/format';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';
import { MAX_UPLOAD_BYTES, UPLOAD_LIMIT_LABEL } from '@/lib/uploadLimits';

// Images contributors asked for (lib/imageRequests.js). Choosing a file uploads
// it to the subject's library and puts it in the waiting block.

async function call(url, options) {
  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || 'تعذّر الاتصال بالخادم');
  return json.data;
}

export default function ImageRequests({ onUploaded }) {
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => call('/api/admin/image-requests')
    .then(setRequests)
    .catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const fill = async (request, file) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) { setError(`الملف أكبر من ${UPLOAD_LIMIT_LABEL}`); return; }
    setBusy(request.blockId); setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('subjectId', request.subjectId);
      form.append('alt', request.note.slice(0, 200));
      const media = await call('/api/media', { method: 'POST', body: form });
      onUploaded?.(media);
      const { imageRequest, ...metadata } = request.metadata;
      await call(`/api/content/blocks/${encodeURIComponent(request.blockId)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: media.url, metadata: { ...metadata, mediaId: media.contentId, alt: media.alt || '' } }),
      });
      await load();
    } catch (e) { setError(e.message); }
    setBusy(null);
  };

  if (!requests.length && !error) return null;
  return (
    <Card title={`طلبات صور (${requests.length})`}>
      {error && <p role="alert" className="t-label text-danger mb-2">{error}</p>}
      <ul className="flex flex-col gap-3">
        {requests.map((r) => (
          <li key={r.blockId} className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0 basis-64">
              <p className="t-ui text-fg-strong">{r.note}</p>
              <p className="t-caption text-fg-muted">«{r.title}» · {formatRelative(r.at)}</p>
            </div>
            <Badge size="sm" tone="neutral">{SUBJECTS_BY_ID[r.subjectId]?.nameAr || r.subjectId}</Badge>
            <Button as="label" size="sm" variant="secondary" disabled={!!busy}>
              {busy === r.blockId ? 'جارٍ الرفع…' : 'ارفع الصورة'}
              <input type="file" accept="image/*" className="sr-only" disabled={!!busy}
                onChange={(e) => { fill(r, e.target.files?.[0]); e.target.value = ''; }} />
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
