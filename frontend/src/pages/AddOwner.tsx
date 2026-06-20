// src/pages/AddOwner.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AddOwner() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [displayNameJp, setDisplayNameJp] = useState('');
  const [silksColor, setSilksColor] = useState('');
  const [silksPattern, setSilksPattern] = useState('');

  async function handleSubmit() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from('owners')
        .insert([{
          display_name:    displayName.trim()    || null,
          display_name_jp: displayNameJp.trim()  || null,
          silks_color:     silksColor.trim()     || null,
          silks_pattern:   silksPattern.trim()   || null,
        }])
        .select('id')
        .single();

      if (sbError) throw sbError;

      navigate(`/owners/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the owner.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">馬主を登録</h1>
        <p className="text-sm text-muted-foreground mt-1">Register a new owner</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="display_name_jp">馬主名（日本語）</Label>
              <Input
                id="display_name_jp"
                placeholder="例：メジロ商事"
                value={displayNameJp}
                onChange={e => setDisplayNameJp(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="display_name">Owner name (EN)</Label>
              <Input
                id="display_name"
                placeholder="e.g. Mejiro Group"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">勝負服</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="silks_color">色</Label>
            <Input
              id="silks_color"
              placeholder="e.g. White, Green Stripes, Blue Sleeves"
              value={silksColor}
              onChange={e => setSilksColor(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="silks_pattern">柄</Label>
            <Input
              id="silks_pattern"
              placeholder="e.g. Horizontal Stripes, Polka Dots"
              value={silksPattern}
              onChange={e => setSilksPattern(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => navigate('/owners')} disabled={loading}>
          キャンセル
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? '登録中...' : '馬主を登録する'}
        </Button>
      </div>
    </div>
  );
}