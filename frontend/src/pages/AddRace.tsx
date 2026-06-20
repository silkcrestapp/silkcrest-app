// src/pages/AddRace.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { racecourseJpConvert } from '../utils/racecourseJp';
import type { Race } from '../types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const RACECOURSES = [
  'Tokyo', 'Kyoto', 'Nakayama', 'Hanshin',
  'Chukyo', 'Sapporo', 'Hakodate', 'Fukushima',
  'Niigata', 'Kokura',
];

const GRADES: { value: Race['grade']; label: string }[] = [
  { value: 'G1',       label: 'G1'        },
  { value: 'G2',       label: 'G2'        },
  { value: 'G3',       label: 'G3'        },
  { value: 'OP',       label: 'OP'        },
  { value: 'Pre-Open', label: 'Pre-Open'  },
  { value: 'Maiden',   label: 'Maiden'    },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const WEEKS  = [1, 2, 3, 4, 5] as const;

export default function AddRace() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [name,        setName]        = useState('');
  const [nameJp,      setNameJp]      = useState('');
  const [grade,       setGrade]       = useState<Race['grade']>('G1');
  const [surface,     setSurface]     = useState<Race['surface']>('Turf');
  const [distance,    setDistance]    = useState<string>('2000');
  const [racecourse,  setRacecourse]  = useState('Tokyo');
  const [raceMonth,   setRaceMonth]   = useState<string>('');
  const [raceWeek,    setRaceWeek]    = useState<string>('');

  async function handleSubmit() {
    setError(null);

    if (!distance || isNaN(Number(distance))) {
      setError('Distance is required.');
      return;
    }

    try {
      setLoading(true);

      const { error: sbError } = await supabase
        .from('races')
        .insert([{
          name:         name.trim()  || null,
          name_jp:      nameJp.trim() || null,
          grade:        grade        || null,
          surface:      surface      || null,
          distance:     Number(distance),
          racecourse:   racecourse   || null,
          racecourse_jp: racecourseJpConvert(racecourse).jpName || null,
          race_month:   raceMonth ? Number(raceMonth) : null,
          race_week:    raceWeek  ? Number(raceWeek)  : null,
        }]);

      if (sbError) throw sbError;

      navigate('/races');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the race.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">レースを登録</h1>
        <p className="text-sm text-muted-foreground mt-1">Register a new race</p>
      </div>

      {/* ── Race name ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">レース情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name_jp">レース名（日本語）</Label>
              <Input
                id="name_jp"
                placeholder="例：ジャパンカップ"
                value={nameJp}
                onChange={e => setNameJp(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Race name (EN)</Label>
              <Input
                id="name"
                placeholder="e.g. Japan Cup"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="grade">格付け</Label>
              <Select value={grade} onValueChange={v => setGrade(v as Race['grade'])}>
                <SelectTrigger id="grade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => (
                    <SelectItem key={g.value} value={g.value!}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="racecourse">競馬場</Label>
              <Select value={racecourse} onValueChange={setRacecourse}>
                <SelectTrigger id="racecourse">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RACECOURSES.map(r => (
                    <SelectItem key={r} value={r}>
                      {r} ({racecourseJpConvert(r).jpName ?? r})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Course ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">コース</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="surface">馬場</Label>
              <Select value={surface} onValueChange={v => setSurface(v as Race['surface'])}>
                <SelectTrigger id="surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Turf">芝 (Turf)</SelectItem>
                  <SelectItem value="Dirt">ダート (Dirt)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="distance">距離 (m)</Label>
              <Input
                id="distance"
                type="number"
                step={100}
                placeholder="例：2000"
                value={distance}
                onChange={e => setDistance(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Schedule ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">開催時期</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="race_month">月</Label>
              <Select value={raceMonth} onValueChange={setRaceMonth}>
                <SelectTrigger id="race_month">
                  <SelectValue placeholder="月を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => (
                    <SelectItem key={m} value={String(m)}>{m}月</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="race_week">週</Label>
              <Select value={raceWeek} onValueChange={setRaceWeek}>
                <SelectTrigger id="race_week">
                  <SelectValue placeholder="週を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {WEEKS.map(w => (
                    <SelectItem key={w} value={String(w)}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => navigate('/races')} disabled={loading}>
          キャンセル
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? '登録中...' : 'レースを登録する'}
        </Button>
      </div>
    </div>
  );
}