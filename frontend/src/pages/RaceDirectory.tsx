import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { Race } from '../types/database';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const GRADES = ['All', 'G1', 'G2', 'G3', 'OP', 'Pre-Open', 'Maiden'] as const;
const PAGE_SIZE = 10;

type GradeFilter = (typeof GRADES)[number];
type SurfaceFilter = 'All' | 'Turf' | 'Dirt';

function getGradeBadgeVariant(grade?: string) {
  switch (grade) {
    case 'G1': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'G2': return 'bg-red-100 text-red-800 border-red-200';
    case 'G3': return 'bg-green-100 text-green-800 border-green-200';
    default:   return 'outline';
  }
}

export default function RaceDirectory() {
  const [races, setRaces] = useState<Race[]>([]);
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('All');
  const [surfaceFilter, setSurfaceFilter] = useState<SurfaceFilter>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchRaces() {
      try {
        setLoading(true);
        const { data, error: sbError } = await supabase
          .from('races')
          .select('*')
          .order('race_month', { ascending: true })
          .order('race_week', { ascending: true });

        if (sbError) throw sbError;
        if (data) setRaces(data as Race[]);
      } catch (err: unknown) {
        setError((err as Error).message ?? 'Failed to fetch race schedule');
      } finally {
        setLoading(false);
      }
    }

    fetchRaces();
  }, []);

  const filteredRaces = races.filter((race) => {
    const matchGrade = gradeFilter === 'All' || race.grade === gradeFilter;
    const matchSurface = surfaceFilter === 'All' || race.surface === surfaceFilter;
    return matchGrade && matchSurface;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRaces.length / PAGE_SIZE));
  const pageRaces = filteredRaces.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (loading) return <div className="p-4 text-muted-foreground">Loading race schedule...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          レーススケジュール <span className="text-muted-foreground font-normal text-lg">Race Schedule</span>
        </h1>

        <div className="flex gap-3">
          <Select
            value={gradeFilter}
            onValueChange={(v) => {
              setGradeFilter(v as GradeFilter)
              setCurrentPage(1);
            }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => (
                <SelectItem key={g} value={g}>
                  {g === 'All' ? 'All Grades' : g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={surfaceFilter}
            onValueChange={(v) => {
              setSurfaceFilter(v as SurfaceFilter)
              setCurrentPage(1);
            }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Surface" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Surfaces</SelectItem>
              <SelectItem value="Turf">芝 (Turf)</SelectItem>
              <SelectItem value="Dirt">ダート (Dirt)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>開催時期</TableHead>
              <TableHead>格付け</TableHead>
              <TableHead>レース名</TableHead>
              <TableHead>競馬場</TableHead>
              <TableHead>コース</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No races match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              pageRaces.map((race) => (
                <TableRow key={race.id}>
                  <TableCell className="font-medium text-muted-foreground text-left">
                    {race.race_month}月 {race.race_week}週
                  </TableCell>

                  <TableCell className="text-left">
                    <Badge className={getGradeBadgeVariant(race.grade)}>
                      {race.grade}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-medium text-left">
                    {race.name_jp}{' '}
                    <span className="text-muted-foreground text-sm font-normal">
                      ({race.name})
                    </span>
                  </TableCell>

                  <TableCell className="text-muted-foreground text-left">
                    {race.racecourse_jp}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-left">
                    <span className={race.surface === 'Turf' ? 'text-green-700 font-medium' : 'text-amber-800 font-medium'}>
                      {race.surface === 'Turf' ? '芝' : 'ダ'} {race.distance}m
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          {filteredRaces.length === 0
            ? 'No results'
            : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredRaces.length)} of ${filteredRaces.length} races`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}