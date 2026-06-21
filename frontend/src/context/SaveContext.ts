import { createContext } from 'react';
import type { SaveContextValue } from '../types/database';

export const SaveContext = createContext<SaveContextValue | null>(null);