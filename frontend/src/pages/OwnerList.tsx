import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useSave } from '../context/useSave';
import type { Owner } from '../types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface OwnerWithCount extends Owner {
  horse_count: number;
}

export default function OwnerList() {
  const { activeSaveId } = useSave();
  const [owners, setOwners] = useState<OwnerWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSaveId) return;

    async function fetchOwners() {
      try {
        // Fetch owners participating in this save, with horse counts scoped to save
        const [saveOwnersRes, horsesRes] = await Promise.all([
          supabase
            .from('save_owners')
            .select('owner_id, owners(id, display_name, display_name_jp, silks_color, silks_pattern)')
            .eq('save_id', activeSaveId),

          supabase
            .from('horses')
            .select('id, owner_id')
            .eq('save_id', activeSaveId),
        ]);

        if (saveOwnersRes.error) throw saveOwnersRes.error;
        if (horsesRes.error) throw horsesRes.error;

        const horseCounts: Record<string, number> = {};
        (horsesRes.data ?? []).forEach(h => {
          if (h.owner_id) {
            horseCounts[h.owner_id] = (horseCounts[h.owner_id] ?? 0) + 1;
          }
        });

        const mapped: OwnerWithCount[] = (saveOwnersRes.data ?? [])
          .filter(row => row.owners !== null)
          .map(row => {
            const o = row.owners as unknown as Owner;
            return {
              ...o,
              horse_count: horseCounts[row.owner_id] ?? 0,
            };
          });

        mapped.sort((a, b) =>
          b.horse_count - a.horse_count ||
          (a.display_name_jp ?? a.display_name).localeCompare(b.display_name_jp ?? b.display_name)
        );

        setOwners(mapped);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load owners.');
      } finally {
        setLoading(false);
      }
    }

    fetchOwners();
  }, [activeSaveId]);

  if (loading) return <div className="p-6 text-muted-foreground">Loading owners…</div>;
  if (error)   return <div className="p-6 text-destructive">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">馬主一覧</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Owner Directory · {owners.length} owners
          </p>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>馬主名</TableHead>
              <TableHead>勝負服</TableHead>
              <TableHead className="text-right">所有馬数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {owners.map(owner => (
              <TableRow key={owner.id}>
                <TableCell className="font-medium text-left">
                  <Link to={`/owners/${owner.id}`} className="text-blue-700 hover:underline">
                    {owner.display_name_jp ?? owner.display_name}
                  </Link>
                  {owner.display_name_jp && (
                    <span className="ml-2 text-xs text-muted-foreground">{owner.display_name}</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground text-left">
                  {[owner.silks_color, owner.silks_pattern].filter(Boolean).join(' · ') || '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={owner.horse_count > 0 ? 'secondary' : 'outline'}>
                    {owner.horse_count}頭
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}