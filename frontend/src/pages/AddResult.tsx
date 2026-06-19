import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import type { Horse, Race } from '../types/database';
import { parseFinishTime, validateFinishTime } from '../utils/finishTime';
import { getWakuban, WAKU_COLORS } from '../utils/wakuban';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Types ─────────────────────────────────────────────────────────────────────

type HorseOption = Pick<Horse, 'id' | 'name' | 'name_jp'>;
type RaceOption = Pick<Race, 'id' | 'name' | 'name_jp' | 'grade'>;

// ── Combobox ──────────────────────────────────────────────────────────────────

interface ComboboxProps<T extends { id: string }> {
  items: T[];
  value: string;
  onSelect: (id: string) => void;
  placeholder: string;
  renderLabel: (item: T) => React.ReactNode;
  filterFn: (item: T, query: string) => boolean;
  displayValue: (item: T) => string;
}

function Combobox<T extends { id: string }>({
  items,
  value,
  onSelect,
  placeholder,
  renderLabel,
  filterFn,
  displayValue,
}: ComboboxProps<T>) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = items.find(i => i.id === value) ?? null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selected ? displayValue(selected) : '');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [selected, displayValue]);

  // Sync display when value changes externally
  useEffect(() => {
    setQuery(selected ? displayValue(selected) : '');
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = query === (selected ? displayValue(selected) : '')
    ? items
    : items.filter(i => filterFn(i, query));

  function handleSelect(item: T) {
    onSelect(item.id);
    setQuery(displayValue(item));
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <Input
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onSelect('');
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md text-sm">
          {filtered.map(item => (
            <li
              key={item.id}
              className={[
                'cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground',
                item.id === value ? 'bg-accent/50 font-medium' : '',
              ].join(' ')}
              onMouseDown={e => {
                e.preventDefault();
                handleSelect(item);
              }}
            >
              {renderLabel(item)}
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && query && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-md">
          No results found.
        </div>
      )}
    </div>
  );
}

// ── Wakuban Badge ─────────────────────────────────────────────────────────────

function WakubanBadge({ gate, runners }: { gate: string; runners: string }) {
  const gateNum = parseInt(gate, 10);
  const runnerNum = parseInt(runners, 10);
  if (!gateNum || !runnerNum) return null;

  const waku = getWakuban(gateNum, runnerNum);
  if (!waku) return null;

  const color = WAKU_COLORS[waku];
  if (!color) return null;

  return (
    <span
      className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold ml-2 border"
      style={{
        backgroundColor: color.bg,
        color: color.text,
        borderColor: color.text === '#FFFFFF' ? color.bg : '#cbd5e0',
      }}
    >
      枠{waku} {color.label}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddResult() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [horses, setHorses] = useState<HorseOption[]>([]);
  const [races, setRaces] = useState<RaceOption[]>([]);

  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [raceYear, setRaceYear] = useState(new Date().getFullYear().toString());
  const [finishPosition, setFinishPosition] = useState('');
  const [finishTimeStr, setFinishTimeStr] = useState('');
  const [finishTimeError, setFinishTimeError] = useState<string | null>(null);
  const [gateNumber, setGateNumber] = useState('');
  const [numberOfRunners, setNumberOfRunners] = useState('');
  const [odds, setOdds] = useState('');
  const [favoriteRanking, setFavoriteRanking] = useState('');
  const [jockey, setJockey] = useState('');

  useEffect(() => {
    async function fetchFormData() {
      const { data: horseData } = await supabase
        .from('horses')
        .select('id, name, name_jp')
        .order('name_jp', { ascending: true });

      const { data: raceData } = await supabase
        .from('races')
        .select('id, name, name_jp, grade')
        .order('name', { ascending: true });

      if (horseData) setHorses(horseData as HorseOption[]);
      if (raceData) setRaces(raceData as RaceOption[]);
    }
    fetchFormData();
  }, []);

  function handleFinishTimeChange(value: string) {
    setFinishTimeStr(value);
    setFinishTimeError(validateFinishTime(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedHorseId || !selectedRaceId) {
      setError('Please select both a horse and a race.');
      return;
    }

    const timeError = validateFinishTime(finishTimeStr);
    if (timeError) {
      setFinishTimeError(timeError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: sbError } = await supabase
        .from('race_entries')
        .insert([{
          horse_id: selectedHorseId,
          race_id: selectedRaceId,
          race_year: parseInt(raceYear, 10) || new Date().getFullYear(),
          finish_position: finishPosition ? parseInt(finishPosition, 10) : null,
          finish_time: finishTimeStr ? parseFinishTime(finishTimeStr) : null,
          gate_number: gateNumber ? parseInt(gateNumber, 10) : null,
          number_of_runners: numberOfRunners ? parseInt(numberOfRunners, 10) : null,
          odds: odds ? parseFloat(odds) : null,
          favorite_ranking: favoriteRanking ? parseInt(favoriteRanking, 10) : null,
          jockey: jockey.trim() || null,
        }]);

      if (sbError) throw sbError;

      navigate('/horses/' + selectedHorseId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save race result.');
    } finally {
      setLoading(false);
    }
  }

  const horseFilterFn = (h: HorseOption, q: string) => {
    const lower = q.toLowerCase();
    return (
      (h.name?.toLowerCase().includes(lower) ?? false) ||
      (h.name_jp?.includes(q) ?? false)
    );
  };

  const raceFilterFn = (r: RaceOption, q: string) => {
    const lower = q.toLowerCase();
    return (
      (r.name?.toLowerCase().includes(lower) ?? false) ||
      (r.name_jp?.includes(q) ?? false)
    );
  };

  const horseDisplayValue = (h: HorseOption) =>
    h.name_jp ? `${h.name_jp}${h.name ? ` (${h.name})` : ''}` : (h.name ?? '');

  const raceDisplayValue = (r: RaceOption) =>
    r.name_jp ? `${r.name_jp}${r.name ? ` (${r.name})` : ''}` : (r.name ?? '');

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            レース結果 登録{' '}
            <span className="text-muted-foreground font-normal text-base ml-1">
              Log Race Result
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 rounded-md bg-destructive/10 text-destructive text-sm px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Horse */}
            <div className="space-y-1.5">
              <Label>Runner (Horse)</Label>
              <Combobox
                items={horses}
                value={selectedHorseId}
                onSelect={setSelectedHorseId}
                placeholder="Type to search horses…"
                filterFn={horseFilterFn}
                renderLabel={h => (
                  <span>
                    {h.name_jp}
                    {h.name && (
                      <span className="ml-1.5 text-xs text-muted-foreground">({h.name})</span>
                    )}
                  </span>
                )}
                displayValue={horseDisplayValue}
              />
            </div>

            {/* Race */}
            <div className="space-y-1.5">
              <Label>Race</Label>
              <Combobox
                items={races}
                value={selectedRaceId}
                onSelect={setSelectedRaceId}
                placeholder="Type to search races…"
                filterFn={raceFilterFn}
                renderLabel={r => (
                  <span>
                    {r.grade && (
                      <span className="mr-1.5 text-xs text-muted-foreground">[{r.grade}]</span>
                    )}
                    {r.name_jp ?? r.name}
                    {r.name_jp && r.name && (
                      <span className="ml-1.5 text-xs text-muted-foreground">({r.name})</span>
                    )}
                  </span>
                )}
                displayValue={raceDisplayValue}
              />
            </div>

            {/* Race Year */}
            <div className="space-y-1.5">
              <Label>Race Year</Label>
              <Input
                type="number"
                value={raceYear}
                onChange={e => setRaceYear(e.target.value)}
                min={1980}
                max={2100}
                required
              />
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-2 gap-4">

              <div className="space-y-1.5">
                <Label>Finishing Position</Label>
                <Input
                  type="number"
                  min={1}
                  value={finishPosition}
                  onChange={e => setFinishPosition(e.target.value)}
                  placeholder="e.g. 1"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Finishing Time
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">m:ss.f</span>
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. 1:23.4"
                  value={finishTimeStr}
                  onChange={e => handleFinishTimeChange(e.target.value)}
                  className={finishTimeError ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {finishTimeError && (
                  <p className="text-xs text-destructive">{finishTimeError}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>No. of Runners</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={numberOfRunners}
                  onChange={e => setNumberOfRunners(e.target.value)}
                  placeholder="e.g. 18"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Gate Number
                  {gateNumber && numberOfRunners && (
                    <WakubanBadge gate={gateNumber} runners={numberOfRunners} />
                  )}
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={gateNumber}
                  onChange={e => setGateNumber(e.target.value)}
                  placeholder="e.g. 3"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Odds</Label>
                <Input
                  type="number"
                  min={1}
                  step="0.1"
                  value={odds}
                  onChange={e => setOdds(e.target.value)}
                  placeholder="e.g. 3.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  人気
                  <span className="font-normal text-muted-foreground text-xs ml-1">Favourite Ranking</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={favoriteRanking}
                  onChange={e => setFavoriteRanking(e.target.value)}
                  placeholder="e.g. 1"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label>Jockey</Label>
                <Input
                  type="text"
                  placeholder="e.g. C. Lemaire"
                  value={jockey}
                  onChange={e => setJockey(e.target.value)}
                />
              </div>

            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/horses')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !selectedHorseId || !selectedRaceId}>
                {loading ? 'Saving…' : 'Record Result'}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}