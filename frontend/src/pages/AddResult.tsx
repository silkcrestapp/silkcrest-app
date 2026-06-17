import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import {type Horse, type Race} from '../types/database';

// Data fetching states for dropdown selectors
type HorseOption = Pick<Horse, 'id' | 'name'>;
type RaceOption = Pick<Race, 'id' | 'name' | 'grade'>;

export default function AddResult() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [horses, setHorses] = useState<HorseOption[]>([]);
  const [races, setRaces] = useState<RaceOption[]>([]);

  // Form states
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [raceYear, setSelectedRaceYear] = useState('');
  const [finishPosition, setFinishPosition] = useState<number>(1);
  const [finishTime, setFinishTime] = useState<number>(1);
  const [gateNumber, setGateNumber] = useState<number>(1);
  const [jockey, setJockey] = useState('');

  useEffect(() => {
    async function fetchFormData() {
      const { data: horseData } = await supabase.from('horses').select('id, name');
      const { data: raceData } = await supabase.from('races').select('id, name, grade');
      
      if (horseData) {
        setHorses(horseData);
        if (horseData.length > 0) setSelectedHorseId(String(horseData[0].id));
      }
      if (raceData) {
        setRaces(raceData);
        if (raceData.length > 0) setSelectedRaceId(String(raceData[0].id));
      }
    }
    fetchFormData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedHorseId || !selectedRaceId) {
      setError('Please select both a horse and a race.');
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
          race_year: Number(raceYear) || new Date().getFullYear(),
          finish_position: Number(finishPosition),
          finish_time: Number(finishTime),
          gate_number: Number(gateNumber),
          jockey: jockey.trim() || null
        }]);

      if (sbError) throw sbError;

      navigate('/horses/'+selectedHorseId); // Route over to check schedules or records
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save race result.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', padding: '2rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h1 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.75rem', color: '#1a202c' }}>レース結果 登録 (Log Race Result)</h1>
      
      {error && <div style={{ color: '#e53e3e', backgroundColor: '#fff5f5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Select Runner (Horse)</label>
          <select value={selectedHorseId} onChange={(e) => setSelectedHorseId(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
            {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Select Race</label>
          <select value={selectedRaceId} onChange={(e) => setSelectedRaceId(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
            {races.map(r => <option key={r.id} value={r.id}>[{r.grade}] {r.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Select Race Year</label>
          <input type="number" value={raceYear} onChange={(e) => setSelectedRaceYear(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Finishing Position</label>
            <input type="number" min="1" value={finishPosition} onChange={(e) => setFinishPosition(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Finishing Time</label>
            <input type="number" min="1" value={finishTime} onChange={(e) => setFinishTime(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Gate Number</label>
            <input type="number" min="1" value={gateNumber} onChange={(e) => setGateNumber(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Jockey Name</label>
            <input type="text" value={jockey} onChange={(e) => setJockey(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} placeholder="e.g. C. Lemaire" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #edf2f7', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={() => navigate('/horses')} style={{ padding: '0.6rem 1.2rem', backgroundColor: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '0.6rem 1.2rem', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Record Result'}
          </button>
        </div>
      </form>
    </div>
  );
}