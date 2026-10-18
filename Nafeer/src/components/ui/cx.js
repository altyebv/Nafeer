// Joins class names, skipping falsy values — `cx('a', cond && 'b')`.
export const cx = (...parts) => parts.filter(Boolean).join(' ');
