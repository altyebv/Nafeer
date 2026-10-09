'use client';
import { createContext, useContext } from 'react';
import { MATH_NOTATION } from '@/shared/curriculum';

// The notation of the subject being edited or previewed. A page that knows its
// subject provides it once (getMathNotation in shared/curriculum.js); every
// formula below — editors, previews, inline formulas — picks it up from here.
export const MathNotationContext = createContext(MATH_NOTATION.LATIN);

export const useMathNotation = () => useContext(MathNotationContext);
