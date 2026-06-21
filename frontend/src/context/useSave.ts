import { useContext } from 'react';
import { SaveContext } from '../context/SaveContext';

export function useSave() {
  const ctx = useContext(SaveContext);
  if (!ctx) throw new Error('useSave must be used within SaveProvider');
  return ctx;
}