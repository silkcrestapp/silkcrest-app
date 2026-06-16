import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { Race } from '../types/database';

export default function RaceDirectory() {
  const [races, setRaces] = useState<Race[]>([]);
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [surfaceFilter, setSurfaceFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRaces() {
      try {
        setLoading(true);
        // Fetch schedule data from the 'races' table
        const { data, error: sbError } = await supabase
          .from('races')
          .select('*')
          .order('race_month', { ascending: true })
          .order('race_week', { ascending: true });

        if (sbError) throw sbError;
        if (data) setRaces(data as Race[]);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch race schedule');
      } finally {
        setLoading(false);
      }
    }

    fetchRaces();
  }, []);

  // Filter logic for Grades and Surfaces
  const filteredRaces = races.filter((race) => {
    const matchGrade = gradeFilter === 'All' || race.grade === gradeFilter;
    const matchSurface = surfaceFilter === 'All' || race.surface === surfaceFilter;
    return matchGrade && matchSurface;
  });

  // Helper styling for race grade tags
  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'G1': return { bg: '#fed7d7', text: '#9b2c2c' };
      case 'G2': return { bg: '#feebc8', text: '#9c4221' };
      case 'G3': return { bg: '#ebf8ff', text: '#2b6cb0' };
      default: return { bg: '#edf2f7', text: '#4a5568' };
    }
  };

  if (loading) return <div style={{ padding: '1rem' }}>Loading race schedule...</div>;
  if (error) return <div style={{ padding: '1rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      {/* Title & Filter Controls Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1a202c' }}>レーススケジュール (Race Schedule)</h1>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Grade Filter */}
          <select 
            value={gradeFilter} 
            onChange={(e) => setGradeFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.95rem' }}
          >
            <option value="All">All Grades</option>
            <option value="G1">G1</option>
            <option value="G2">G2</option>
            <option value="G3">G3</option>
          </select>

          {/* Surface Filter */}
          <select 
            value={surfaceFilter} 
            onChange={(e) => setSurfaceFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.95rem' }}
          >
            <option value="All">All Surfaces</option>
            <option value="Turf">芝 (Turf)</option>
            <option value="Dirt">ダート (Dirt)</option>
          </select>
        </div>
      </div>

      {/* Calendar Grid Table */}
      <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#edf2f7', borderBottom: '2px solid #e2e8f0', color: '#4a5568' }}>
              <th style={{ padding: '0.75rem 1rem', width: '120px' }}>開催時期 (Schedule)</th>
              <th style={{ padding: '0.75rem 1rem', width: '80px' }}>格付け</th>
              <th style={{ padding: '0.75rem 1rem' }}>レース名 (Race Name)</th>
              <th style={{ padding: '0.75rem 1rem' }}>条件 (Course / Distance)</th>
            </tr>
          </thead>
          <tbody>
            {filteredRaces.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
                  No races found matching the selected criteria.
                </td>
              </tr>
            ) : (
              filteredRaces.map((race) => {
                const badge = getGradeColor(race.grade);
                return (
                  <tr 
                    key={race.id} 
                    style={{ borderBottom: '1px solid #edf2f7', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f7fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Time Frame Column */}
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#4a5568' }}>
                      {race.race_month}月 {race.race_week?.replace('Week ', '')}週
                    </td>
                    
                    {/* Grade Badge Column */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        backgroundColor: badge.bg, 
                        color: badge.text, 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold' 
                      }}>
                        {race.grade}
                      </span>
                    </td>

                    {/* Race Name Toggles */}
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: '#2d3748' }}>
                      {race.name_jp} <span style={{ color: '#718096', fontSize: '0.85rem', fontWeight: 'normal' }}>({race.name})</span>
                    </td>

                    {/* Conditions Config Column */}
                    <td style={{ padding: '0.75rem 1rem', color: '#4a5568' }}>
                      {race.racecourse_jp} — <span style={{ 
                        fontWeight: '500', 
                        color: race.surface === 'Turf' ? '#2f855a' : '#9c4221' 
                      }}>
                        {race.surface === 'Turf' ? '芝' : 'ダ'} {race.distance}m
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}