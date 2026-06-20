// src/pages/OwnerList.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
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
import { Button } from '@/components/ui/button';

interface OwnerWithCount extends Owner {
  horse_count: number;
}

export default function OwnerList() {
  const [owners,  setOwners]  = useState<OwnerWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function fetchOwners() {
      try {
        const { data, error: sbError } = await supabase
          .from('owners')
          .select('*, horses(id)');

        if (sbError) throw sbError;

        const mapped: OwnerWithCount[] = (data ?? []).map(o => ({
          ...o,
          horse_count: Array.isArray(o.horses) ? o.horses.length : 0,
        }));

        // Sort by horse count descending, then by name
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
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Loading owners…</div>;
  if (error)   return <div className="p-6 text-destructive">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">馬主一覧</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {owners.length}人の馬主が登録されています
          </p>
        </div>
        <Button asChild>
          <Link to="/owners/new">馬主を登録する</Link>
        </Button>
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
                  <Link
                    to={`/owners/${owner.id}`}
                    className="text-blue-700 hover:underline"
                  >
                    {owner.display_name_jp ?? owner.display_name}
                  </Link>
                  {owner.display_name_jp && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {owner.display_name}
                    </span>
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