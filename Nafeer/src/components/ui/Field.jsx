'use client';
import { cloneElement, forwardRef, isValidElement, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from './cx';

// ─── Field + Input / Textarea / Select ────────────────────────────────────────
// docs/design-system.md §8. Field owns the label, hint and error and wires
// them to its one control (id, aria-describedby, aria-invalid), so a call
// site never hand-writes those ids:
//
//   <Field label="عنوان الدرس" hint="يظهر للطالب" error={err} required>
//     <Input value={title} onChange={…} />
//   </Field>

const CONTROL =
  'w-full rounded-control bg-sunken text-fg font-ui text-sm border border-line-strong ' +
  'transition-colors duration-fast ease-out-soft ' +
  'hover:border-line-accent focus:border-accent-hover focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  'aria-[invalid=true]:border-danger';

export const Input = forwardRef(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(CONTROL, 'h-10 px-3', className)} {...rest} />;
});

export const Textarea = forwardRef(function Textarea({ className, rows = 3, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={cx(CONTROL, 'px-3 py-2.5 leading-relaxed resize-y', className)} {...rest} />;
});

export const Select = forwardRef(function Select({ className, children, ...rest }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cx(CONTROL, 'h-10 ps-3 pe-9 appearance-none cursor-pointer', className)} {...rest}>
        {children}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-3 text-fg-subtle"
      />
    </div>
  );
});

export function Field({ label, hint, error, required = false, id: idProp, className, children }) {
  const autoId  = useId();
  const id      = idProp || autoId;
  const hintId  = hint  ? `${id}-hint`  : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        required: required || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })
    : children;

  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="t-label text-fg">
          {label}
          {required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
        </label>
      )}
      {control}
      {error
        ? <p id={errorId} className="t-caption text-danger">{error}</p>
        : hint && <p id={hintId} className="t-caption text-fg-subtle">{hint}</p>}
    </div>
  );
}
