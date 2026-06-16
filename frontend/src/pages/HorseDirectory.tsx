import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { type Horse } from '../types/database';

export default function HorseDirectory() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHorses() {
      try {
        setLoading(true);
        // Fetch core layout data from the Supabase 'horses' table
        const { data, error: sbError } = await supabase
          .from('horses')
          .select('id, name, name_jp, gender, birth_year, speed, stamina, growth_type')
          .order('birth_year', { ascending: false });

        if (sbError) throw sbError;
        if (data) setHorses(data as Horse[]);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch horses');
      } finally {
        setLoading(false);
      }
    }

    fetchHorses();
  }, []);

  // Filter horses dynamically based on English or Japanese input string
  const filteredHorses = horses.filter((horse) => {
    const matchName = horse.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchNameJp = horse.name_jp?.includes(searchTerm);
    return matchName || matchNameJp;
  });

  if (loading) return <div style={{ padding: '1rem' }}>Loading horse directory...</div>;
  if (error) return <div style={{ padding: '1rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1a202c' }}>競走馬検索 (Horse Directory)</h1>
        
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by name / 馬名検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            width: '300px',
            borderRadius: '4px',
            border: '1px solid #cbd5e0',
            fontSize: '1rem'
          }}
        />
      </div>

      {/* Netkeiba Style Data Table */}
      <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#edf2f7', borderBottom: '2px solid #e2e8f0', color: '#4a5568' }}>
              <th style={{ padding: '0.75rem 1rem' }}>馬名 (Horse Name)</th>
              <th style={{ padding: '0.75rem 1rem' }}>性別 (Gender)</th>
              <th style={{ padding: '0.75rem 1rem' }}>生年 (Birth Year)</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>SP (Speed)</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>ST (Stamina)</th>
            </tr>
          </thead>
          <tbody>
            {filteredHorses.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
                  No horses matched your search criteria.
                </td>
              </tr>
            ) : (
              filteredHorses.map((horse) => (
                <tr 
                  key={horse.id} 
                  style={{ borderBottom: '1px solid #edf2f7', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f7fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Localized Name Toggle Column */}
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>
                    <Link to={`/horses/${horse.id}`} style={{ color: '#2b6cb0', textDecoration: 'none' }}>
                      {horse.name_jp} <span style={{ color: '#718096', fontSize: '0.85rem', fontWeight: 'normal' }}>{horse.name ? `(${horse.name})` : ''}</span>
                    </Link>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4a5568' }}>{horse.gender || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4a5568' }}>{horse.birth_year}年</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 'bold', color: '#e53e3e' }}>
                    {horse.speed ?? '-'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#2b6cb0' }}>
                    {horse.stamina ?? '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}