import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function AddOwner() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [displayNameJp, setDisplayNameJp] = useState('');
  const [silksColor, setSilksColor] = useState('');
  const [silksPattern, setSilksPattern] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const newOwner = {
        display_name: displayName.trim() || null,
        display_name_jp: displayNameJp.trim() || null,
        silks_color: silksColor.trim() || null,
        silks_pattern: silksPattern.trim() || null,
      };

      const { error: sbError } = await supabase
        .from('owners')
        .insert([newOwner]);

      if (sbError) throw sbError;

      navigate('/horses'); // Redirect back to dashboard
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while saving the owner.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', padding: '2rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h1 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.75rem', color: '#1a202c' }}>馬主 新規登録 (Register New Owner)</h1>
      
      {error && <div style={{ color: '#e53e3e', backgroundColor: '#fff5f5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Owner Name (English)</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} placeholder="e.g. Mejiro Group" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>馬主名 (Japanese)</label>
          <input type="text" value={displayNameJp} onChange={(e) => setDisplayNameJp(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} placeholder="e.g. メジロ商事" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>勝負服 (Silk Colors description)</label>
          <input type="text" value={silksColor} onChange={(e) => setSilksColor(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} placeholder="e.g. White, Green Stripes, Blue Sleeves" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>勝負服 (Silk Patterns description)</label>
          <input type="text" value={silksPattern} onChange={(e) => setSilksPattern(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} placeholder="e.g. White, Green Stripes, Blue Sleeves" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #edf2f7', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={() => navigate('/horses')} style={{ padding: '0.6rem 1.2rem', backgroundColor: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '0.6rem 1.2rem', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Register Owner'}
          </button>
        </div>
      </form>
    </div>
  );
}