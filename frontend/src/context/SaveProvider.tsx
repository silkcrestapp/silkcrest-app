import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import { type SaveFile } from '../types/database';
import { SaveContext } from '../context/SaveContext';

const STORAGE_KEY = 'silkcrest_active_save_id';

export function SaveProvider({ children }: { children: ReactNode }) {
  const [saves, setSaves] = useState<SaveFile[]>([]);
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null);
  const [activeSaveName, setActiveSaveName] = useState<string | null>(null);
  const [loadingSaves, setLoadingSaves] = useState(true);

  useEffect(() => {
    async function fetchSaves() {
      const { data } = await supabase
        .from('save_files')
        .select('*')
        .order('created_at', { ascending: true });

      if (!data) { setLoadingSaves(false); return; }

      setSaves(data as SaveFile[]);

      // Auto-select if only one save exists
      if (data.length === 1) {
        setActiveSaveId(data[0].id);
        setActiveSaveName(data[0].name);
        setLoadingSaves(false);
        return;
      }

      // Restore from localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const match = data.find(s => s.id === stored);
        if (match) {
          setActiveSaveId(match.id);
          setActiveSaveName(match.name);
        }
      }

      setLoadingSaves(false);
    }

    fetchSaves();
  }, []);

  function setSave(save: SaveFile) {
    setActiveSaveId(save.id);
    setActiveSaveName(save.name);
    localStorage.setItem(STORAGE_KEY, save.id);
  }

  function clearSave() {
    setActiveSaveId(null);
    setActiveSaveName(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <SaveContext.Provider value={{ saves, activeSaveId, activeSaveName, setSave, clearSave, loadingSaves }}>
      {children}
    </SaveContext.Provider>
  );
}
