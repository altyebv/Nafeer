'use client';
import { createContext } from 'react';

// The signed-in contributor as the editor layout resolved them, lead powers
// included. Pages that need those read it here instead of querying again.
export const ContributorContext = createContext(null);
