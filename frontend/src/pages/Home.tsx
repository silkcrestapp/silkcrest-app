import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { formatFinishTime } from '../utils/finishTime';
import { getWakuban, WAKU_COLORS } from '../utils/wakuban';
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecentEntry {
  id: string;
  race_year: number | null;
  finish_position: number | null;
  finish_time: number | null;
  gate_number: number | null;
  number_of_runners: number | null;
  odds: number | null;
  favorite_ranking: number | null;
  jockey: string | null;
  created_at: string;
  horses: {
    id: string;
    name: string | null;
    name_jp: string | null;
    owners: {
      display_name: string;
      display_name_jp: string | null;
    } | null;
  } | null;
  races: {
    id: string;
    name: string;
    name_jp: string | null;
    grade: string | null;
    racecourse: string;
    racecourse_jp: string | null;
    distance: number;
    surface: string | null;
  } | null;
}

interface OwnerStat {
  id: string;
  display_name: string;
  display_name_jp: string | null;
  horse_count: number;
}

interface StableStats {
  totalHorses: number;
  totalOwners: number;
  totalRaces: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GRADE_VARIANT: Record<string, string> = {
  G1: 'bg-yellow-400 text-yellow-900 border-yellow-500',
  G2: 'bg-slate-300 text-slate-800 border-slate-400',
  G3: 'bg-orange-300 text-orange-900 border-orange-400',
  OP: 'bg-blue-100 text-blue-800 border-blue-200',
};

function GradeBadge({ grade }: { grade: string | null | undefined }) {
  if (!grade) return null;
  const cls = GRADE_VARIANT[grade] ?? 'bg-muted text-muted-foreground border-border';
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-bold ${cls}`}>
      {grade}
    </span>
  );
}

function WakuDot({ gate, runners }: { gate: number | null; runners: number | null }) {
  if (!gate || !runners) return null;
  const waku = getWakuban(gate, runners);
  if (!waku) return null;
  const color = WAKU_COLORS[waku];
  if (!color) return null;
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border mr-1.5 shrink-0"
      style={{ backgroundColor: color.bg, color: color.text, borderColor: color.text === '#FFFFFF' ? '#cbd5e0' : color.bg }}
      title={`枠${waku} ${color.label}`}
    >
      {waku}
    </span>
  );
}

function FinishBadge({ pos }: { pos: number | null }) {
  if (pos == null) return <span className="text-muted-foreground">—</span>;
  if (pos === 1) return <span className="font-bold text-yellow-600">1st</span>;
  if (pos === 2) return <span className="font-bold text-slate-500">2nd</span>;
  if (pos === 3) return <span className="font-bold text-orange-600">3rd</span>;
  return <span className="text-muted-foreground">{pos}th</span>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [owners, setOwners] = useState<OwnerStat[]>([]);
  const [stats, setStats] = useState<StableStats>({ totalHorses: 0, totalOwners: 0, totalRaces: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const [entriesRes, horsesRes, ownersRes, countRes] = await Promise.all([
        supabase
          .from('race_entries')
          .select(`
            id, race_year, finish_position, finish_time,
            gate_number, number_of_runners, odds, favorite_ranking,
            jockey, created_at,
            horses(id, name, name_jp, owners(display_name, display_name_jp)),
            races(id, name, name_jp, grade, racecourse, racecourse_jp, distance, surface)
          `)
          .order('created_at', { ascending: false })
          .limit(10),

        supabase
          .from('horses')
          .select('id, owner_id'),

        supabase
          .from('owners')
          .select('id, display_name, display_name_jp'),

        supabase
        .from('race_entries')
        .select('*', { count: 'exact', head: true }), 
      ]);

      if (entriesRes.data) {
        setRecentEntries(entriesRes.data as unknown as RecentEntry[]);
      }

      if (horsesRes.data && ownersRes.data) {
        const horseCounts: Record<string, number> = {};
        horsesRes.data.forEach(h => {
          if (h.owner_id) {
            horseCounts[h.owner_id] = (horseCounts[h.owner_id] ?? 0) + 1;
          }
        });

        const ownerStats: OwnerStat[] = ownersRes.data.map(o => ({
          ...o,
          horse_count: horseCounts[o.id] ?? 0,
        }))
        .filter(o => o.horse_count > 0)
        .sort((a, b) => b.horse_count - a.horse_count);

        setOwners(ownerStats);
        setStats({
          totalHorses: horsesRes.data.length,
          totalOwners: ownersRes.data.length,
          totalRaces: countRes.count ?? 0,
        });
      }

      setLoading(false);
    }

    fetchAll();
  }, []);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8">

      {/* Hero */}
      <div className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">
          Silkcrest
        </h1>
        <p className="text-muted-foreground text-lg">
          Winning Post 10 2026 · Private Racing Database
        </p>
      </div>

      {/* Stable Stats */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Horses Registered" value={stats.totalHorses} />
        <StatCard label="Owners" value={stats.totalOwners} />
        <StatCard label="Race Results Logged" value={stats.totalRaces} />
      </div>

      {/* Main content: Recent Results + Owner Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Race Results — takes 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                最近の戦績
                <span className="text-muted-foreground font-normal text-sm ml-2">Recent Race Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentEntries.length === 0 ? (
                <p className="px-6 py-8 text-sm italic text-muted-foreground text-center">
                  No race results recorded yet. Log your first result to get started.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horse</TableHead>
                      <TableHead>Race</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Gate</TableHead>
                      <TableHead>Finish</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentEntries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {entry.horses ? (
                            <div>
                              <Link
                                to={`/horses/${entry.horses.id}`}
                                className="font-medium text-blue-700 hover:underline leading-tight block"
                              >
                                {entry.horses.name_jp ?? entry.horses.name}
                              </Link>
                              {entry.horses.owners && (
                                <span className="text-xs text-muted-foreground">
                                  {entry.horses.owners.display_name_jp ?? entry.horses.owners.display_name}
                                </span>
                              )}
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {entry.races ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <GradeBadge grade={entry.races.grade} />
                              <span className="text-sm">
                                {entry.races.name_jp ?? entry.races.name}
                              </span>
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground text-sm">
                          {entry.race_year ?? '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <WakuDot gate={entry.gate_number} runners={entry.number_of_runners} />
                            <span className="text-sm tabular-nums text-muted-foreground">
                              {entry.gate_number ?? '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <FinishBadge pos={entry.finish_position} />
                        </TableCell>
                        <TableCell className="tabular-nums text-sm text-muted-foreground">
                          {formatFinishTime(entry.finish_time)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Owner Roster — takes 1/3 width on large screens */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                馬主一覧
                <span className="text-muted-foreground font-normal text-sm ml-2">Owner Roster</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {owners.length === 0 ? (
                <p className="px-6 py-8 text-sm italic text-muted-foreground text-center">
                  No owners registered yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {owners.map(owner => (
                    <li key={owner.id} className="flex items-start justify-between px-6 py-3">
                      <div className="flex items-start flex-col min-w-0">
                        <Link
                          to={`/owners/${owner.id}`}
                          className="font-medium text-sm leading-tight truncate text-blue-700 hover:underline">
                            <p className="font-medium text-sm leading-tight truncate">
                              {owner.display_name_jp ?? owner.display_name}
                            </p>
                          </Link>
                        {owner.display_name_jp && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{owner.display_name}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="tabular-nums shrink-0 ml-3 mt-0.5">
                        {owner.horse_count} {owner.horse_count === 1 ? 'horse' : 'horses'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-3 pb-4 px-4 text-center">
        <p className="text-3xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}