import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import type { Race } from '../types/database';

export default function AddRace() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [nameJp, setNameJp] = useState('');
  const [grade, setGrade] = useState('G1');
  const [courseType, setCourseType] = useState<Race['surface']>('Turf');
  const [distance, setDistance] = useState<number>(2000);
  const [location, setLocation] = useState('Tokyo');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const newRace = {
        name: name.trim() || null,
        name_jp: nameJp.trim() || null,
        grade,
        course_type: courseType,
        distance: Number(distance),
        location,
      };

      const { error: sbError } = await supabase
        .from('races')
        .insert([newRace]);

      if (sbError) throw sbError;

      navigate('/races');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while saving the race.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', padding: '2rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h1 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.75rem', color: '#1a202c' }}>レース 新規登録 (Register New Race)</h1>
      
      {error && <div style={{ color: '#e53e3e', backgroundColor: '#fff5f5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Race Name (English)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} placeholder="e.g. Japan Cup" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>レース名 (Japanese)</label>
            <input type="text" value={nameJp} onChange={(e) => setNameJp(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} placeholder="e.g. ジャパンカップ" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Grade</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
              <option value="G1">G1</option>
              <option value="G2">G2</option>
              <option value="G3">G3</option>
              <option value="OP">Open Listed (OP)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>競馬場 (Location)</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
              <option value="Tokyo">Tokyo (東京)</option>
              <option value="Kyoto">Kyoto (京都)</option>
              <option value="Nakayama">Nakayama (中山)</option>
              <option value="Hanshin">Hanshin (阪神)</option>
              <option value="Chukyo">Chukyo (中京)</option>
              <option value="Sapporo">Sapporo (札幌)</option>
              <option value="Hakodate">Hakodate (函館)</option>
              <option value="Fukushima">Fukushima (福島)</option>
              <option value="Niigata">Niigata (新潟)</option>
              <option value="Kokura">Kokura (小倉)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Track Type</label>
            <select value={courseType} onChange={(e) => setCourseType(e.target.value as Race['surface'])} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
              <option value="Turf">Turf (芝)</option>
              <option value="Dirt">Dirt (ダート)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Distance (meters)</label>
            <input type="number" step="100" value={distance} onChange={(e) => setDistance(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #edf2f7', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={() => navigate('/races')} style={{ padding: '0.6rem 1.2rem', backgroundColor: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '0.6rem 1.2rem', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Register Race'}
          </button>
        </div>
      </form>
    </div>
  );
}