// src/pages/OwnerDetail.tsx

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import type { Owner, Horse, RaceEntry } from '../types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ── Types ────────────────────────────────────────────────────

interface HorseSummary extends Horse {
  race_count:  number;
  win_count:   number;
  best_finish: number | null;
}

// ── Gender label ─────────────────────────────────────────────

function genderLabel(gender: Horse['gender']) {
  if (gender === 'Male')    return '牡';
  if (gender === 'Female')  return '牝';
  if (gender === 'Gelding') return '騸';
  return '—';
}

// ── Page ─────────────────────────────────────────────────────

export default function OwnerDetail() {
  const { id } = useParams<{ id: string }>();

  const [owner,   setOwner]   = useState<Owner | null>(null);
  const [horses,  setHorses]  = useState<HorseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      if (!id) return;
      try {
        setLoading(true);

        // Owner
        const { data: ownerData, error: oErr } = await supabase
          .from('owners')
          .select('*')
          .eq('id', id)
          .single();
        if (oErr) throw oErr;

        // Horses belonging to this owner
        const { data: horseData, error: hErr } = await supabase
          .from('horses')
          .select('*')
          .eq('owner_id', id)
          .order('birth_year', { ascending: false });
        if (hErr) throw hErr;

        const horseList = horseData ?? [];

        // Race entries for all horses in one query
        const horseIds = horseList.map(h => h.id);
        let entries: RaceEntry[] = [];

        if (horseIds.length > 0) {
          const { data: entryData, error: eErr } = await supabase
            .from('race_entries')
            .select('*')
            .in('horse_id', horseIds);
          if (eErr) throw eErr;
          entries = entryData ?? [];
        }

        // Build per-horse summary
        const summaries: HorseSummary[] = horseList.map(horse => {
          const horseEntries = entries.filter(e => e.horse_id === horse.id);
          const positions    = horseEntries
            .map(e => e.finish_position)
            .filter((p): p is number => p !== null && p !== undefined);
          return {
            ...horse,
            race_count:  horseEntries.length,
            win_count:   positions.filter(p => p === 1).length,
            best_finish: positions.length > 0 ? Math.min(...positions) : null,
          };
        });

        setOwner(ownerData);
        setHorses(summaries);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load owner profile.');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [id]);

  if (loading) return <div className="p-6 text-muted-foreground">Loading owner profile…</div>;
  if (error ?? !owner) return <div className="p-6 text-destructive">Error: {error ?? 'Owner not found'}</div>;

  const totalRaces = horses.reduce((sum, h) => sum + h.race_count, 0);
  const totalWins  = horses.reduce((sum, h) => sum + h.win_count,  0);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">

      {/* Header */}
      <div className="space-y-1">
        <Link
          to="/owners"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
        >
          ← 馬主一覧に戻る
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">
          {owner.display_name_jp ?? owner.display_name}
        </h1>
        {owner.display_name_jp && (
          <p className="text-muted-foreground text-lg">{owner.display_name}</p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">所有馬数</p>
            <p className="text-3xl font-bold mt-1">{horses.length}<span className="text-base font-normal text-muted-foreground ml-1">頭</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">出走数</p>
            <p className="text-3xl font-bold mt-1">{totalRaces}<span className="text-base font-normal text-muted-foreground ml-1">戦</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">勝利数</p>
            <p className="text-3xl font-bold mt-1">{totalWins}<span className="text-base font-normal text-muted-foreground ml-1">勝</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Silks */}
      {(owner.silks_color ?? owner.silks_pattern) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">勝負服</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-6 text-sm">
            {owner.silks_color && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">色</p>
                <p>{owner.silks_color}</p>
              </div>
            )}
            {owner.silks_pattern && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">柄</p>
                <p>{owner.silks_pattern}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Horses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">所有馬</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {horses.length === 0 ? (
            <p className="px-6 text-sm italic text-muted-foreground">登録された馬はありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>馬名</TableHead>
                  <TableHead>性別</TableHead>
                  <TableHead>生年</TableHead>
                  <TableHead className="text-right">出走</TableHead>
                  <TableHead className="text-right">最高着順</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {horses.map(horse => (
                  <TableRow key={horse.id}>
                    <TableCell>
                      <Link
                        to={`/horses/${horse.id}`}
                        className="font-medium hover:underline"
                      >
                        {horse.name_jp ?? horse.name ?? '—'}
                      </Link>
                      {horse.name_jp && horse.name && (
                        <span className="ml-2 text-xs text-muted-foreground">{horse.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {genderLabel(horse.gender)}
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">
                      {horse.birth_year}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {horse.race_count > 0 ? `${horse.race_count}戦` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {horse.best_finish !== null ? (
                        <Badge variant={
                          horse.best_finish === 1 ? 'default' :
                          horse.best_finish <= 3  ? 'secondary' : 'outline'
                        }>
                          {horse.best_finish}着
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}