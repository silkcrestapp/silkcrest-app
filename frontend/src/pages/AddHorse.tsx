// src/pages/AddHorse.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useSave } from '../context/useSave';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GRADES, gradeToRank, type Grade } from '../utils/gradeUtils';
import type { Owner, Horse } from '../types/database';

// ── Stat definitions ──────────────────────────────────────────────────────────

interface StatDef {
  key: keyof Pick<
    Horse,
    'speed' | 'grit' | 'power' | 'guts' | 'intelligence' | 'spurt' | 'flexibility' | 'health'
  >;
  jp: string;
  en: string;
}

const STATS: StatDef[] = [
  { key: 'speed',        jp: 'スピード',   en: 'Speed'        },
  { key: 'guts',         jp: '勝負根性',   en: 'Guts'         },
  { key: 'power',        jp: 'パワー',     en: 'Power'        },
  { key: 'health',       jp: '健康',       en: 'Health'       },
  { key: 'intelligence', jp: '賢さ',       en: 'Intelligence' },
  { key: 'grit',         jp: '精神力',     en: 'Grit'         },
  { key: 'flexibility',  jp: '柔軟性',     en: 'Flexibility'  },
  { key: 'spurt',        jp: '瞬発力',     en: 'Spurt'        },
];

const GRADE_OPTIONS = [...GRADES].reverse() as Grade[];

// ── Grade selector ────────────────────────────────────────────────────────────

interface GradeSelectorProps {
  label: { jp: string; en: string };
  value: Grade | null;
  onChange: (grade: Grade | null) => void;
}

const GRADE_COLORS: Record<string, string> = {
  'S+': 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700',
  'S':  'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700',
  'A+': 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
  'A':  'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
  'B+': 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
  'B':  'bg-stone-100 text-stone-600 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-600',
};

const gradeButtonClass = (grade: Grade, selected: boolean): string => {
  const base = 'h-8 min-w-[2.75rem] px-2 text-sm font-medium border rounded-md transition-all';
  if (selected) {
    return `${base} ${GRADE_COLORS[grade] ?? 'bg-muted text-foreground border-border'} ring-2 ring-offset-1 ring-primary`;
  }
  return `${base} bg-transparent text-muted-foreground border-border hover:bg-muted`;
};

function GradeSelector({ label, value, onChange }: GradeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <Label className="text-sm font-medium">{label.jp}</Label>
        <span className="text-xs text-muted-foreground">{label.en}</span>
        {value === null && (
          <span className="ml-auto text-xs text-muted-foreground/50">???</span>
        )}
        {value !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {GRADE_OPTIONS.map(grade => (
          <button
            key={grade}
            type="button"
            onClick={() => onChange(grade === value ? null : grade)}
            className={gradeButtonClass(grade, value === grade)}
            aria-pressed={value === grade}
            aria-label={`Set grade to ${grade}`}
          >
            {grade}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Form state ────────────────────────────────────────────────────────────────

type StatGrades = Record<
  'speed' | 'grit' | 'power' | 'guts' | 'intelligence' | 'spurt' | 'flexibility' | 'health',
  Grade | null
>;

interface FormState {
  name: string;
  name_jp: string;
  owner_id: string;
  sire_id: string;
  dam_id: string;
  gender: 'Male' | 'Female' | 'Gelding' | '';
  birth_year: string;
  coat_color: string;
  bloodline_type: string;
  growth_type: string;
  grades: StatGrades;
}

const DEFAULT_FORM: FormState = {
  name: '',
  name_jp: '',
  owner_id: '',
  sire_id: '',
  dam_id: '',
  gender: '',
  birth_year: '',
  coat_color: '',
  bloodline_type: '',
  growth_type: '',
  grades: {
    speed: null, grit: null, power: null, guts: null,
    intelligence: null, spurt: null, flexibility: null, health: null,
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AddHorse() {
  const navigate = useNavigate();
  const { activeSaveId } = useSave();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [horses, setHorses] = useState<Pick<Horse, 'id' | 'name' | 'name_jp'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSaveId) return;

    // Owners are global but filtered to those in this save
    supabase
      .from('save_owners')
      .select('owners(id, display_name, display_name_jp)')
      .eq('save_id', activeSaveId)
      .then(({ data }) => {
        const ownerList = (data ?? [])
          .map(row => row.owners as unknown as Owner)
          .filter(Boolean);
        setOwners(ownerList);
      });

    // Sire/dam options scoped to this save
    supabase
      .from('horses')
      .select('id, name, name_jp')
      .eq('save_id', activeSaveId)
      .order('name_jp')
      .then(({ data }) => setHorses(data ?? []));
  }, [activeSaveId]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const setGrade = (key: keyof StatGrades, grade: Grade | null) => {
    setForm(prev => ({ ...prev, grades: { ...prev.grades, [key]: grade } }));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!form.birth_year || isNaN(Number(form.birth_year))) {
      setError('Birth year is required.');
      return;
    }

    if (!activeSaveId) {
      setError('No active save selected.');
      return;
    }

    setLoading(true);

    const payload = {
      save_id:        activeSaveId,
      name:           form.name          || null,
      name_jp:        form.name_jp       || null,
      owner_id:       form.owner_id      || null,
      sire_id:        form.sire_id       || null,
      dam_id:         form.dam_id        || null,
      gender:         form.gender        || null,
      birth_year:     Number(form.birth_year),
      coat_color:     form.coat_color    || null,
      bloodline_type: form.bloodline_type || null,
      growth_type:    form.growth_type   || null,
      speed:         form.grades.speed        !== null ? gradeToRank(form.grades.speed)        : null,
      grit:          form.grades.grit          !== null ? gradeToRank(form.grades.grit)          : null,
      power:         form.grades.power         !== null ? gradeToRank(form.grades.power)         : null,
      guts:          form.grades.guts          !== null ? gradeToRank(form.grades.guts)          : null,
      intelligence:  form.grades.intelligence  !== null ? gradeToRank(form.grades.intelligence)  : null,
      spurt:         form.grades.spurt         !== null ? gradeToRank(form.grades.spurt)         : null,
      flexibility:   form.grades.flexibility   !== null ? gradeToRank(form.grades.flexibility)   : null,
      health:        form.grades.health        !== null ? gradeToRank(form.grades.health)        : null,
    };

    const { data, error: insertError } = await supabase
      .from('horses')
      .insert(payload)
      .select('id')
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    navigate(`/horses/${data.id}`);
  };

  const horseOptions = horses.map(h => ({
    value: h.id,
    label: [h.name_jp, h.name].filter(Boolean).join(' / '),
  }));

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">馬を登録</h1>
        <p className="text-sm text-muted-foreground mt-1">Register a new horse</p>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader><CardTitle className="text-base">基本情報</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name_jp">馬名（日本語）</Label>
              <Input id="name_jp" placeholder="例：シルクレスト" value={form.name_jp} onChange={e => setField('name_jp', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Horse name (EN)</Label>
              <Input id="name" placeholder="e.g. Silkcrest" value={form.name} onChange={e => setField('name', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="birth_year">生年 <span className="text-destructive">*</span></Label>
              <Input id="birth_year" type="number" placeholder="例：2020" value={form.birth_year} onChange={e => setField('birth_year', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">性別</Label>
              <Select value={form.gender} onValueChange={v => setField('gender', v as FormState['gender'])}>
                <SelectTrigger id="gender"><SelectValue placeholder="選択..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">牡 (Male)</SelectItem>
                  <SelectItem value="Female">牝 (Female)</SelectItem>
                  <SelectItem value="Gelding">騸 (Gelding)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="owner_id">馬主</Label>
            <Select value={form.owner_id} onValueChange={v => setField('owner_id', v)}>
              <SelectTrigger id="owner_id"><SelectValue placeholder="馬主を選択..." /></SelectTrigger>
              <SelectContent>
                {owners.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.display_name_jp ?? o.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sire_id">父</Label>
              <Select value={form.sire_id} onValueChange={v => setField('sire_id', v)}>
                <SelectTrigger id="sire_id"><SelectValue placeholder="父馬を選択..." /></SelectTrigger>
                <SelectContent>
                  {horseOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dam_id">母</Label>
              <Select value={form.dam_id} onValueChange={v => setField('dam_id', v)}>
                <SelectTrigger id="dam_id"><SelectValue placeholder="母馬を選択..." /></SelectTrigger>
                <SelectContent>
                  {horseOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="growth_type">成長型</Label>
              <Input id="growth_type" placeholder="例：早熟" value={form.growth_type} onChange={e => setField('growth_type', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coat_color">毛色</Label>
              <Input id="coat_color" placeholder="例：鹿毛" value={form.coat_color} onChange={e => setField('coat_color', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bloodline_type">血統タイプ</Label>
            <Input id="bloodline_type" placeholder="例：スピード型" value={form.bloodline_type} onChange={e => setField('bloodline_type', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            基本能力
            <Badge variant="outline" className="text-xs font-normal">すべて任意</Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            不明な能力は空欄のままにしてください（???と表示されます）
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {STATS.map(stat => (
            <GradeSelector
              key={stat.key}
              label={{ jp: stat.jp, en: stat.en }}
              value={form.grades[stat.key]}
              onChange={grade => setGrade(stat.key, grade)}
            />
          ))}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => navigate(-1)} disabled={loading}>キャンセル</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? '登録中...' : '馬を登録する'}
        </Button>
      </div>
    </div>
  );
}