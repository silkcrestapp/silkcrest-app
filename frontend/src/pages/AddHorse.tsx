import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function AddHorse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Field States
  const [name, setName] = useState('');
  const [nameJp, setNameJp] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Gelding'>('Male');
  const [birthYear, setBirthYear] = useState<number>(new Date().getFullYear());
  const [coatColor, setCoatColor] = useState('Bay');
  const [bloodlineType, setBloodlineType] = useState('');
  const [growthType, setGrowthType] = useState('Normal');

  // Winning Post Core 8 Parameter States
  const [speed, setSpeed] = useState<number>(70);
  const [stamina, setStamina] = useState<number>(50);
  const [power, setPower] = useState<number>(70);
  const [guts, setGuts] = useState<number>(70);
  const [intelligence, setIntelligence] = useState<number>(70);
  const [spurt, setSpurt] = useState<number>(70);
  const [flexibility, setFlexibility] = useState<number>(70);
  const [health, setHealth] = useState<number>(70);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Construct payload matching our PostgreSQL schema constraints
      const newHorse = {
        name: name.trim() || null,
        name_jp: nameJp.trim() || null,
        gender,
        birth_year: Number(birthYear),
        coat_color: coatColor,
        bloodline_type: bloodlineType.trim() || null,
        growth_type: growthType,
        speed: Number(speed),
        stamina: Number(stamina),
        power: Number(power),
        guts: Number(guts),
        intelligence: Number(intelligence),
        spurt: Number(spurt),
        flexibility: Number(flexibility),
        health: Number(health)
      };

      const { error: sbError } = await supabase
        .from('horses')
        .insert([newHorse]);

      if (sbError) throw sbError;

      // Navigate back to the master directory upon successful insertion
      navigate('/horses');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while saving the horse.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', backgroundColor: '#fff', padding: '2rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h1 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.75rem', color: '#1a202c' }}>競走馬 新規登録 (Register New Horse)</h1>
      
      {error && <div style={{ color: '#e53e3e', backgroundColor: '#fff5f5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Core Identity Row */}
        <h3 style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '0.4rem', color: '#4a5568' }}>基本情報 (Basic Profiles)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>馬名 (English Name)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} placeholder="e.g. Twin Turbo" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>馬名 日本語 (Japanese Name)</label>
            <input type="text" value={nameJp} onChange={(e) => setNameJp(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} placeholder="e.g. ツインターボ" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>性別 (Gender)</label>
            <select value={gender} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGender(e.target.value as 'Male' | 'Female' | 'Gelding')} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
              <option value="Male">Male (牡)</option>
              <option value="Female">Female (牝)</option>
              <option value="Gelding">Gelding (騸)</option>
            </select>
          </div>
          <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>成長型 (Growth Type)</label>
              <select 
                  value={growthType} 
                  onChange={(e) => setGrowthType(e.target.value)} 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0' }}
              >
                  <option value="Early">早熟 (Early)</option>
                  <option value="Normal">普通 (Normal)</option>
                  <option value="Late">晩成 (Late)</option>
                  <option value="Ascent">追込型/覚醒 (Awakening / Sudden)</option>
              </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>生年 (Birth Year)</label>
            <input type="number" value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>毛色 (Coat Color)</label>
            <input type="text" value={coatColor} onChange={(e) => setCoatColor(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>系統 (Bloodline Group)</label>
            <input type="text" value={bloodlineType} onChange={(e) => setBloodlineType(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} placeholder="e.g. Royal Charger Line" />
          </div>
        </div>

        {/* Winning Post Attributes Block */}
        <h3 style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '0.4rem', color: '#4a5568' }}>能力パラメータ (Winning Post Parameters)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Speed (SP)', val: speed, set: setSpeed },
            { label: 'Stamina (ST)', val: stamina, set: setStamina },
            { label: 'Power', val: power, set: setPower },
            { label: 'Guts', val: guts, set: setGuts },
            { label: 'Intelligence', val: intelligence, set: setIntelligence },
            { label: 'Spurt', val: spurt, set: setSpurt },
            { label: 'Flexibility', val: flexibility, set: setFlexibility },
            { label: 'Health', val: health, set: setHealth },
          ].map((param, index) => (
            <div key={index}>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: '500' }}>{param.label}</label>
              <input type="number" min="1" max="100" value={param.val} onChange={(e) => param.set(Number(e.target.value))} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
            </div>
          ))}
        </div>

        {/* Action Controls Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #edf2f7', paddingTop: '1.5rem' }}>
          <button type="button" onClick={() => navigate('/horses')} style={{ padding: '0.6rem 1.2rem', backgroundColor: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ padding: '0.6rem 1.2rem', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Saving...' : 'Register Horse'}
          </button>
        </div>
      </form>
    </div>
  );
}