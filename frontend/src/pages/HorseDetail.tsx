import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import type { Horse } from '../types/database';

// Extend our component state to easily manage a 3-generation pedigree tree mapping
interface PedigreeTree {
  current: Horse | null;
  sire: Horse | null;
  dam: Horse | null;
  sire_of_sire: Horse | null;
  dam_of_sire: Horse | null;
  sire_of_dam: Horse | null;
  dam_of_dam: Horse | null;
}

export default function HorseDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PedigreeTree>({
    current: null, sire: null, dam: null,
    sire_of_sire: null, dam_of_sire: null, sire_of_dam: null, dam_of_dam: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHorseAndPedigree() {
      try {
        setLoading(true);
        if (!id) return;

        // 1. Fetch the target horse along with its immediate parents in a single query
        const { data: horse, error: hError } = await supabase
          .from('horses')
          .select(`
            *,
            sire:sire_id(*),
            dam:dam_id(*)
          `)
          .eq('id', id)
          .single();

        if (hError) throw hError;
        if (!horse) throw new Error('Horse not found');

        // Cast nested objects from the join query
        const sireData = horse.sire as unknown as Horse | null;
        const damData = horse.dam as unknown as Horse | null;

        // 2. Fetch Grandparents if parents exist in our database
        let ss: Horse | null = null;
        let ds: Horse | null = null;
        let sd: Horse | null = null;
        let dd: Horse | null = null;

        if (sireData) {
          const { data: sAncestors } = await supabase
            .from('horses')
            .select('id, name, name_jp')
            .or(`id.eq.${sireData.sire_id},id.eq.${sireData.dam_id}`);
          
          ss = sAncestors?.find(h => h.id === sireData.sire_id) as Horse || null;
          ds = sAncestors?.find(h => h.id === sireData.dam_id) as Horse || null;
        }

        if (damData) {
          const { data: dAncestors } = await supabase
            .from('horses')
            .select('id, name, name_jp')
            .or(`id.eq.${damData.sire_id},id.eq.${damData.dam_id}`);
          
          sd = dAncestors?.find(h => h.id === damData.sire_id) as Horse || null;
          dd = dAncestors?.find(h => h.id === damData.dam_id) as Horse || null;
        }

        setData({
          current: horse as Horse,
          sire: sireData,
          dam: damData,
          sire_of_sire: ss,
          dam_of_sire: ds,
          sire_of_dam: sd,
          dam_of_dam: dd
        });

      } catch (err: any) {
        setError(err.message || 'Failed to load horse profile');
      } finally {
        setLoading(false);
      }
    }

    fetchHorseAndPedigree();
  }, [id]);

  if (loading) return <div style={{ padding: '1rem' }}>Loading horse profile...</div>;
  if (error || !data.current) return <div style={{ padding: '1rem', color: 'red' }}>Error: {error || 'Horse profile unavailable'}</div>;

  const { current, sire, dam, sire_of_sire, dam_of_sire, sire_of_dam, dam_of_dam } = data;

  // Render micro helper block for ancestry boxes
  const PedigreeBox = ({ horse, label, bg }: { horse: Horse | null, label: string, bg: string }) => (
    <div style={{ padding: '0.75rem', backgroundColor: bg, border: '1px solid #cbd5e0', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '60px' }}>
      <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 'bold' }}>{label}</span>
      {horse ? (
        <Link to={`/horses/${horse.id}`} style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: '500', fontSize: '0.95rem' }}>
          {horse.name_jp} <span style={{ fontSize: '0.8rem', color: '#4a5568' }}>{horse.name ? `(${horse.name})` : ''}</span>
        </Link>
      ) : (
        <span style={{ color: '#a0aec0', fontSize: '0.9rem', fontStyle: 'italic' }}>Unknown Ancestor</span>
      )}
    </div>
  );

  return (
    <div>
      {/* Header Info */}
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/horses" style={{ color: '#4a5568', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Directory</Link>
        <h1 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '2.25rem' }}>{current.name_jp}</h1>
        <p style={{ margin: 0, color: '#718096', fontSize: '1.1rem' }}>{current.name} · {current.birth_year}年生まれ · {current.gender}</p>
      </div>

      {/* Core Stats Overview */}
      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', borderBottom: '2px solid #edf2f7', paddingBottom: '0.5rem' }}>能力因子 (Game Attributes)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
          <div><strong>Speed (SP):</strong> <span style={{ color: '#e53e3e', fontWeight: 'bold' }}>{current.speed ?? '-'}</span></div>
          <div><strong>Stamina (ST):</strong> <span style={{ color: '#2b6cb0', fontWeight: 'bold' }}>{current.stamina ?? '-'}</span></div>
          <div><strong>Power:</strong> {current.power ?? '-'}</div>
          <div><strong>Guts:</strong> {current.guts ?? '-'}</div>
          <div><strong>Intelligence:</strong> {current.intelligence ?? '-'}</div>
          <div><strong>Spurt:</strong> {current.spurt ?? '-'}</div>
          <div><strong>Flexibility:</strong> {current.flexibility ?? '-'}</div>
          <div><strong>Health:</strong> {current.health ?? '-'}</div>
        </div>
      </div>

      {/* 3-Generation Pedigree Table */}
      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 1rem 0', borderBottom: '2px solid #edf2f7', paddingBottom: '0.5rem' }}>血統表 (3-Generation Pedigree)</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'stretch' }}>
          
          {/* Generation 1: Parents (Structured as multi-row span layouts via CSS flex) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-around' }}>
            <PedigreeBox horse={sire} label="Sire (父)" bg="#ebf8ff" />
            <PedigreeBox horse={dam} label="Dam (母)" bg="#fff5f5" />
          </div>

          {/* Generation 2: Grandparents (Sire Side) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <PedigreeBox horse={sire_of_sire} label="Sire of Sire (父父)" bg="#ebf8ff" />
              <PedigreeBox horse={dam_of_sire} label="Dam of Sire (父母)" bg="#fff5f5" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <PedigreeBox horse={sire_of_dam} label="Sire of Dam (母父)" bg="#ebf8ff" />
              <PedigreeBox horse={dam_of_dam} label="Dam of Dam (母母)" bg="#fff5f5" />
            </div>
          </div>

          {/* Generation 3: Theoretical context slots (Placeholder message for UI layout balance) */}
          <div style={{ backgroundColor: '#f7fafc', padding: '1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #e2e8f0', textAlign: 'center', color: '#718096', fontSize: '0.85rem' }}>
            WP10 Lineage:<br />
            {current.bloodline_type || 'No Lineage Group Set'}
          </div>

        </div>
      </div>
    </div>
  );
}