// src/pages/AddOwner.tsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useSave } from '../context/useSave';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ── Form state ────────────────────────────────────────────────────────────────

interface OwnerFormState {
  displayName: string;
  displayNameJp: string;
  silksColor: string;
  silksPattern: string;
}

const DEFAULT_OWNER_FORM: OwnerFormState = {
  displayName: '',
  displayNameJp: '',
  silksColor: '',
  silksPattern: '',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AddOwner() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { activeSaveId } = useSave();
  const [form, setForm] = useState<OwnerFormState>(DEFAULT_OWNER_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load owner data if in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;

    supabase
      .from('owners')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(`Failed to load owner: ${fetchError.message}`);
          return;
        }

        if (data) {
          setForm({
            displayName: data.display_name ?? '',
            displayNameJp: data.display_name_jp ?? '',
            silksColor: data.silks_color ?? '',
            silksPattern: data.silks_pattern ?? '',
          });
        }
      });
  }, [isEditMode, id]);

  async function handleSubmit() {
    if (!isEditMode && !activeSaveId) {
      setError('No active save selected.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        display_name:    form.displayName.trim()   || null,
        display_name_jp: form.displayNameJp.trim() || null,
        silks_color:     form.silksColor.trim()    || null,
        silks_pattern:   form.silksPattern.trim()  || null,
      };

      let ownerId: string;

      if (isEditMode && id) {
        // PATCH: Update existing owner
        const { error: updateError } = await supabase
          .from('owners')
          .update(payload)
          .eq('id', id)
          .select();

        if (updateError) throw updateError;
        ownerId = id;
      } else {
        // INSERT: Create new owner
        const { data, error: ownerError } = await supabase
          .from('owners')
          .insert([payload])
          .select('id')
          .single();

        if (ownerError) throw ownerError;
        ownerId = data.id;

        // Associate owner with the active save (only for new owners)
        const { error: saveOwnerError } = await supabase
          .from('save_owners')
          .insert([{ save_id: activeSaveId, owner_id: ownerId }]);

        if (saveOwnerError) throw saveOwnerError;
      }

      navigate(`/owners/${ownerId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the owner.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{isEditMode ? '馬主を編集' : '馬主を登録'}</h1>
        <p className="text-sm text-muted-foreground mt-1">{isEditMode ? 'Edit owner information' : 'Register a new owner'}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">基本情報</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="display_name_jp">馬主名（日本語）</Label>
              <Input
                id="display_name_jp"
                placeholder="例：メジロ商事"
                value={form.displayNameJp}
                onChange={e => setForm({ ...form, displayNameJp: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="display_name">Owner name (EN)</Label>
              <Input
                id="display_name"
                placeholder="e.g. Mejiro Group"
                value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">勝負服</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="silks_color">色</Label>
            <Input
              id="silks_color"
              placeholder="e.g. White, Green Stripes, Blue Sleeves"
              value={form.silksColor}
              onChange={e => setForm({ ...form, silksColor: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="silks_pattern">柄</Label>
            <Input
              id="silks_pattern"
              placeholder="e.g. Horizontal Stripes, Polka Dots"
              value={form.silksPattern}
              onChange={e => setForm({ ...form, silksPattern: e.target.value })}
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
          {loading ? (isEditMode ? '保存中...' : '登録中...') : (isEditMode ? '変更を保存' : '馬主を登録する')}
        </Button>
      </div>
    </div>
  );
}