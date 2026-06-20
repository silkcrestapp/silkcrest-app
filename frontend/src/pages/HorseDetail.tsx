import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import type { Horse, RaceEntryWithRace } from '../types/database';
import { formatFinishTime } from '../utils/finishTime';
import { getWakuban, WAKU_COLORS } from '../utils/wakuban';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HorseStatsPanel } from '../components/HorseStatsPanel';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PedigreeTree {
  current: Horse | null;
  sire: Horse | null;
  dam: Horse | null;
  sire_of_sire: Horse | null;
  dam_of_sire: Horse | null;
  sire_of_dam: Horse | null;
  dam_of_dam: Horse | null;
}

interface PedigreeBoxProps {
  horse: Horse | null;
  label: string;
  side: 'sire' | 'dam';
}

const PedigreeBox = ({ horse, label, side }: PedigreeBoxProps) => (
  <div
    className={[
      'flex flex-col justify-center gap-1 rounded border px-3 py-2 min-h-[64px]',
      side === 'sire'
        ? 'bg-blue-50 border-blue-200'
        : 'bg-rose-50 border-rose-200',
    ].join(' ')}
  >
    <span className="text-[0.7rem] font-bold uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
    {horse ? (
      <Link
        to={`/horses/${horse.id}`}
        className="font-medium text-sm text-blue-700 hover:underline leading-tight"
      >
        {horse.name_jp}
        {horse.name && (
          <span className="ml-1 text-xs text-muted-foreground">({horse.name})</span>
        )}
      </Link>
    ) : (
      <span className="text-xs italic text-muted-foreground">Unknown Ancestor</span>
    )}
  </div>
);

const finishBadgeVariant = (pos: number | null | undefined) => {
  if (pos === 1) return 'default';
  if (pos === 2 || pos === 3) return 'secondary';
  return 'outline';
};

// ── Wakuban dot ──────────────────────────────────────────────

interface WakubanDotProps {
  gateNumber: number | null | undefined;
  numberOfRunners: number | null | undefined;
}

function WakubanDot({ gateNumber, numberOfRunners }: WakubanDotProps) {
  if (!gateNumber || !numberOfRunners) return <span className="text-muted-foreground">—</span>;
  const waku = getWakuban(gateNumber, numberOfRunners);
  if (!waku) return <span className="tabular-nums text-sm">{gateNumber}</span>;
  const colors = WAKU_COLORS[waku];
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
        style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.text === '#FFFFFF' ? '#cbd5e0' : colors.bg }}
      >
        {waku}
      </span>
      <span className="tabular-nums text-sm text-muted-foreground">{gateNumber}</span>
    </div>
  );
}

// ── Grade badge ──────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  G1: 'bg-blue-100 text-blue-800 border-blue-200',
  G2: 'bg-red-100 text-red-800 border-red-200',
  G3: 'bg-green-100 text-green-800 border-green-200',
};

function GradeBadge({ grade }: { grade: string | undefined }) {
  if (!grade) return <span className="text-muted-foreground">—</span>;
  const cls = GRADE_COLORS[grade];
  if (cls) {
    return (
      <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-semibold ${cls}`}>
        {grade}
      </span>
    );
  }
  return <Badge variant="outline" className="text-xs">{grade}</Badge>;
}

export default function HorseDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PedigreeTree>({
    current: null, sire: null, dam: null,
    sire_of_sire: null, dam_of_sire: null, sire_of_dam: null, dam_of_dam: null,
  });
  const [results, setResults] = useState<RaceEntryWithRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        if (!id) return;

        const { data: horse, error: hError } = await supabase
          .from('horses')
          .select(`*, sire:sire_id(*), dam:dam_id(*)`)
          .eq('id', id)
          .single();

        if (hError) throw hError;
        if (!horse) throw new Error('Horse not found');

        const sireData = horse.sire as unknown as Horse | null;
        const damData = horse.dam as unknown as Horse | null;

        let ss: Horse | null = null;
        let ds: Horse | null = null;
        let sd: Horse | null = null;
        let dd: Horse | null = null;

        if (sireData) {
          const { data: sAncestors } = await supabase
            .from('horses')
            .select('id, name, name_jp')
            .or(`id.eq.${sireData.sire_id},id.eq.${sireData.dam_id}`);
          ss = sAncestors?.find(h => h.id === sireData.sire_id) as Horse ?? null;
          ds = sAncestors?.find(h => h.id === sireData.dam_id) as Horse ?? null;
        }

        if (damData) {
          const { data: dAncestors } = await supabase
            .from('horses')
            .select('id, name, name_jp')
            .or(`id.eq.${damData.sire_id},id.eq.${damData.dam_id}`);
          sd = dAncestors?.find(h => h.id === damData.sire_id) as Horse ?? null;
          dd = dAncestors?.find(h => h.id === damData.dam_id) as Horse ?? null;
        }

        const { data: entries, error: rError } = await supabase
          .from('race_entries')
          .select(`*, races(*)`)
          .eq('horse_id', id)
          .order('race_year', { ascending: false });

        if (rError) throw rError;

        const sortedEntries = (entries ?? []).sort((a, b) => {
          if (b.race_year !== a.race_year) return b.race_year - a.race_year;
          const monthA = a.races?.race_month ?? 0;
          const monthB = b.races?.race_month ?? 0;
          return monthB - monthA;
        });

        setData({
          current: horse as Horse,
          sire: sireData,
          dam: damData,
          sire_of_sire: ss,
          dam_of_sire: ds,
          sire_of_dam: sd,
          dam_of_dam: dd,
        });
        setResults((sortedEntries ?? []) as RaceEntryWithRace[]);

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load horse profile');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading horse profile…</div>;
  }

  if (error ?? !data.current) {
    return (
      <div className="p-6 text-destructive">
        Error: {error ?? 'Horse profile unavailable'}
      </div>
    );
  }

  const { current, sire, dam, sire_of_sire, dam_of_sire, sire_of_dam, dam_of_dam } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 space-y-6">

      {/* Header */}
      <div className="space-y-1">
        <Link
          to="/horses"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left block"
        >
          ← Back to Directory
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">{current.name_jp}</h1>
        <p className="text-muted-foreground text-lg">
          {current.name} · {current.birth_year}年生まれ · {current.gender}
        </p>
      </div>

      {/* Game Attributes */}
      <Card>
        <CardTitle className="text-base">
          能力因子 <span className="text-muted-foreground font-normal text-sm ml-1">Game Attributes</span>
        </CardTitle>
        <CardContent>
          <HorseStatsPanel horse={current} />
        </CardContent>
      </Card>

      {/* Race Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            戦績 <span className="text-muted-foreground font-normal text-sm ml-1">Race Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {results.length === 0 ? (
            <p className="px-6 text-sm italic text-muted-foreground">No race results recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>年</TableHead>
                  <TableHead>競馬場</TableHead>
                  <TableHead>レース名</TableHead>
                  <TableHead>距離</TableHead>
                  <TableHead>枠番</TableHead>
                  <TableHead>オッズ</TableHead>
                  <TableHead>人気</TableHead>
                  <TableHead>着順</TableHead>
                  <TableHead>タイム</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((entry) => (
                  <TableRow key={entry.id}>
                    {/* 年 */}
                    <TableCell className="tabular-nums">
                      {entry.race_year ?? '—'}
                    </TableCell>

                    {/* 競馬場 + surface */}
                    <TableCell>
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm">
                          {entry.races.racecourse_jp ?? entry.races.racecourse}
                        </span>
                        {entry.races.surface && (
                          <span className={`text-[11px] ${entry.races.surface === 'Turf' ? 'text-green-600' : 'text-amber-600'}`}>
                            {entry.races.surface === 'Turf' ? '芝' : 'ダート'}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* 距離 */}
                    <TableCell className="tabular-nums text-sm">
                      {entry.races.distance}m
                    </TableCell>

                    {/* レース名 + grade badge */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GradeBadge grade={entry.races.grade} />
                        <span className="font-medium text-sm">
                          {entry.races.name_jp ?? entry.races.name}
                        </span>
                      </div>
                    </TableCell>

                    {/* 枠番 dot */}
                    <TableCell>
                      <WakubanDot
                        gateNumber={entry.gate_number}
                        numberOfRunners={entry.number_of_runners}
                      />
                    </TableCell>

                    {/* オッズ */}
                    <TableCell className="tabular-nums text-sm">
                      {entry.odds != null ? entry.odds : '—'}
                    </TableCell>

                    {/* 人気 */}
                    <TableCell className="tabular-nums text-sm">
                      {entry.favorite_ranking != null ? `${entry.favorite_ranking}番人気` : '—'}
                    </TableCell>

                    {/* 着順 */}
                    <TableCell>
                      <Badge variant={finishBadgeVariant(entry.finish_position)}>
                        {entry.finish_position != null ? `${entry.finish_position}着` : '—'}
                      </Badge>
                    </TableCell>

                    {/* タイム */}
                    <TableCell className="tabular-nums text-sm">
                      {entry.finish_time != null ? formatFinishTime(entry.finish_time) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pedigree */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            血統表 <span className="text-muted-foreground font-normal text-sm ml-1">3-Generation Pedigree</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {/* Gen 1 */}
            <div className="flex flex-col gap-3 justify-around">
              <PedigreeBox horse={sire} label="Sire 父" side="sire" />
              <PedigreeBox horse={dam} label="Dam 母" side="dam" />
            </div>

            {/* Gen 2 */}
            <div className="flex flex-col gap-3 justify-between">
              <div className="flex flex-col gap-2">
                <PedigreeBox horse={sire_of_sire} label="Sire of Sire 父父" side="sire" />
                <PedigreeBox horse={dam_of_sire} label="Dam of Sire 父母" side="dam" />
              </div>
              <div className="flex flex-col gap-2">
                <PedigreeBox horse={sire_of_dam} label="Sire of Dam 母父" side="sire" />
                <PedigreeBox horse={dam_of_dam} label="Dam of Dam 母母" side="dam" />
              </div>
            </div>

            {/* Lineage */}
            <div className="flex items-center justify-center rounded border border-dashed border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold mb-1">WP10 Lineage</p>
                <p>{current.bloodline_type ?? 'No Lineage Group Set'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}