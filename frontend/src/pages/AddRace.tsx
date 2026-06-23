// src/pages/AddRace.tsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

// ── Form state ────────────────────────────────────────────────────────────────

interface RaceFormState {
  name: string;
  nameJp: string;
  grade: Race['grade'];
  surface: Race['surface'];
  distance: string;
  racecourse: string;
  raceMonth: string;
  raceWeek: string;
}

const DEFAULT_RACE_FORM: RaceFormState = {
  name: '',
  nameJp: '',
  grade: 'G1',
  surface: 'Turf',
  distance: '2000',
  racecourse: 'Tokyo',
  raceMonth: '',
  raceWeek: '',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AddRace() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [form, setForm] = useState<RaceFormState>(DEFAULT_RACE_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Load race data if in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;

    supabase
      .from('races')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(`Failed to load race: ${fetchError.message}`);
          return;
        }

        if (data) {
          const raceData = data as Race;
          setForm({
            name: raceData.name ?? '',
            nameJp: raceData.name_jp ?? '',
            grade: (raceData.grade ?? 'G1') as Race['grade'],
            surface: (raceData.surface ?? 'Turf') as Race['surface'],
            distance: String(raceData.distance ?? '2000'),
            racecourse: raceData.racecourse ?? 'Tokyo',
            raceMonth: raceData.race_month ? String(raceData.race_month) : '',
            raceWeek: raceData.race_week ? String(raceData.race_week) : '',
          });
        }
      });
  }, [isEditMode, id]);

  async function handleSubmit() {
    setError(null);

    if (!form.distance || isNaN(Number(form.distance))) {
      setError('Distance is required.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name:         form.name.trim()  || null,
        name_jp:      form.nameJp.trim() || null,
        grade:        form.grade        || null,
        surface:      form.surface      || null,
        distance:     Number(form.distance),
        racecourse:   form.racecourse   || null,
        racecourse_jp: racecourseJpConvert(form.racecourse).jpName || null,
        race_month:   form.raceMonth ? Number(form.raceMonth) : null,
        race_week:    form.raceWeek  ? Number(form.raceWeek)  : null,
      };

      if (isEditMode && id) {
        // PATCH: Update existing race
        const { error: updateError } = await supabase
          .from('races')
          .update(payload)
          .eq('id', id);

        if (updateError) throw updateError;
      } else {
        // INSERT: Create new race
        const { error: insertError } = await supabase
          .from('races')
          .insert([payload]);

        if (insertError) throw insertError;
      }

      setLoading(false);
      navigate('/races');
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the race.');
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{isEditMode ? 'レースを編集' : 'レースを登録'}</h1>
        <p className="text-sm text-muted-foreground mt-1">{isEditMode ? 'Edit race information' : 'Register a new race'}</p>
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
                value={form.nameJp}
                onChange={e => setForm({ ...form, nameJp: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Race name (EN)</Label>
              <Input
                id="name"
                placeholder="e.g. Japan Cup"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="grade">格付け</Label>
              <Select value={form.grade} onValueChange={v => setForm({ ...form, grade: v as Race['grade'] })}>
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
              <Select value={form.racecourse} onValueChange={v => setForm({ ...form, racecourse: v })}>
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
              <Select value={form.surface} onValueChange={v => setForm({ ...form, surface: v as Race['surface'] })}>
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
                value={form.distance}
                onChange={e => setForm({ ...form, distance: e.target.value })}
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
              <Select value={form.raceMonth} onValueChange={v => setForm({ ...form, raceMonth: v })}>
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
              <Select value={form.raceWeek} onValueChange={v => setForm({ ...form, raceWeek: v })}>
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
          {loading ? (isEditMode ? '保存中...' : '登録中...') : (isEditMode ? '変更を保存' : 'レースを登録する')}
        </Button>
      </div>
    </div>
  );
}