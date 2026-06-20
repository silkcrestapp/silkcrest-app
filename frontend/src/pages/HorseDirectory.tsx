import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import type { HorseWithOwner } from '../types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'name_jp' | 'birth_year' | 'speed' | 'stamina' | 'growth_type';
type SortDir = 'asc' | 'desc';

interface SortState {
  key: SortKey;
  dir: SortDir;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const GENDER_LABEL: Record<string, string> = {
  Male: '牡',
  Female: '牝',
  Gelding: '騸',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function SortIcon({ col, sort }: { col: SortKey; sort: SortState }) {
  if (sort.key !== col) return <ChevronsUpDown className="inline ml-1 h-3 w-3 opacity-40" />;
  return sort.dir === 'asc'
    ? <ChevronUp className="inline ml-1 h-3 w-3" />
    : <ChevronDown className="inline ml-1 h-3 w-3" />;
}

function SortableHead({
  col,
  sort,
  onSort,
  children,
  className,
}: {
  col: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TableHead
      className={`cursor-pointer select-none whitespace-nowrap ${className ?? ''}`}
      onClick={() => onSort(col)}
    >
      {children}
      <SortIcon col={col} sort={sort} />
    </TableHead>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HorseDirectory() {
  const [horses, setHorses] = useState<HorseWithOwner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'name_jp', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(event.target.value);
  }

  useEffect(() => {
    async function fetchHorses() {
      try {
        setLoading(true);
        const { data, error: sbError } = await supabase
          .from('horses')
          .select(`
            id, name, name_jp, gender, birth_year,
            speed, stamina, growth_type, owner_id,
            sire_id,
            owners(id, display_name, display_name_jp)
          `)
          .order('name_jp', { ascending: true });

        if (sbError) throw sbError;
        if (data) setHorses(data as unknown as HorseWithOwner[]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch horses');
      } finally {
        setLoading(false);
      }
    }

    fetchHorses();
  }, []);

  // Toggle sort — same key flips direction, new key defaults to asc
  const handleSort = (key: SortKey) => {
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
    setPage(1);
  };

  // Filter + sort client-side (stables are small enough)
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const result = horses.filter(h =>
      (h.name?.toLowerCase().includes(term)) ||
      (h.name_jp?.includes(searchTerm)) ||
      (h.owners?.display_name?.toLowerCase().includes(term)) ||
      (h.owners?.display_name_jp?.includes(searchTerm))
    );

    result.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    return result;
  }, [horses, searchTerm, sort]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading horse directory…</div>;
  }

  if (error) {
    return <div className="p-6 text-destructive">Error: {error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">競走馬検索</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Horse Directory · {filtered.length} horses</p>
        </div>
        <Input
          type="text"
          placeholder="Search by name / 馬名検索…"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full sm:w-72"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead col="name_jp" sort={sort} onSort={handleSort}>
                馬名 / Horse Name
              </SortableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Sex</TableHead>
              <SortableHead col="birth_year" sort={sort} onSort={handleSort}>
                生年
              </SortableHead>
              <TableHead>Sire 父</TableHead>
              <SortableHead col="speed" sort={sort} onSort={handleSort} className="text-center">
                SP
              </SortableHead>
              <SortableHead col="stamina" sort={sort} onSort={handleSort} className="text-center">
                ST
              </SortableHead>
              <SortableHead col="growth_type" sort={sort} onSort={handleSort}>
                Growth Type
              </SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground italic">
                  No horses matched your search.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((horse) => (
                <TableRow key={horse.id}>
                  <TableCell className="font-medium text-left">
                    <Link
                      to={`/horses/${horse.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      {horse.name_jp}
                    </Link>
                    {horse.name && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({horse.name})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-left">
                    {horse.owners
                      ? (horse.owners.display_name_jp ?? horse.owners.display_name)
                      : <span className="italic text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell>
                    {horse.gender ? (
                      <Badge variant="outline" className="font-normal">
                        {GENDER_LABEL[horse.gender] ?? horse.gender}
                      </Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {horse.birth_year}年
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {horse.sire_id
                      ? <SireName sireId={horse.sire_id} allHorses={horses} />
                      : '—'
                    }
                  </TableCell>
                  <TableCell className="text-center font-bold text-red-500 tabular-nums">
                    {horse.speed ?? '—'}
                  </TableCell>
                  <TableCell className="text-center font-bold text-blue-600 tabular-nums">
                    {horse.stamina ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {horse.growth_type ?? '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

    </div>
  );
}

// ── Sire name resolver ────────────────────────────────────────────────────────
// Looks up the sire from the already-fetched horses list to avoid extra queries

function SireName({ sireId, allHorses }: { sireId: string; allHorses: HorseWithOwner[] }) {
  const sire = allHorses.find(h => h.id === sireId);
  if (!sire) return <span className="italic">—</span>;
  return (
    <Link to={`/horses/${sire.id}`} className="hover:underline text-foreground">
      {sire.name_jp ?? sire.name ?? '—'}
    </Link>
  );
}