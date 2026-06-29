import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './utils/supabaseClient';
import { SaveProvider } from './context/SaveProvider';
import { useSave } from './context/useSave';
import { useOwnerProfile } from './hooks/useOwnerProfile';

// Core Directory & Detail Page Imports
import Home from './pages/Home';
import HorseDirectory from './pages/HorseDirectory';
import HorseDetail from './pages/HorseDetail';
import RaceDirectory from './pages/RaceDirectory';
import Login from './pages/Login';
import OwnerList from './pages/OwnerList';
import OwnerDetail from './pages/OwnerDetail';
import RegisterPage from './pages/RegisterPage'
import OwnerPortal from './pages/OwnerPortal';
import OwnerSignin from './pages/OwnerSignin';

// Administrative Creation Form Page Imports
import AddHorse from './pages/AddHorse';
import AddOwner from './pages/AddOwner';
import AddRace from './pages/AddRace';
import AddResult from './pages/AddResult';
import InvitePage from './pages/InvitePage'

// Save File Imports
import SaveSelect from './pages/SaveSelect';

function AppShell() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { activeSaveId, activeSaveName, saves, setSave, loadingSaves } = useSave();
  const { isOwner } = useOwnerProfile();

  useEffect(() => {
    async function checkAdminStatus(sessionUser: { id: string } | null) {
      if (!sessionUser) {
        setIsLoggedIn(false);
        setIsAdmin(false);
        setCheckingAuth(false);
        return;
      }

      setIsLoggedIn(true);

      try {
        const { data, error } = await supabase
          .from('admin_profiles')
          .select('id')
          .eq('id', sessionUser.id);

        if (error) {
          console.error('Supabase Query Error:', error.message);
          setIsAdmin(false);
        } else {
          setIsAdmin(data && data.length === 1);
        }
      } catch (err) {
        console.error('Critical Auth Exception:', err);
        setIsAdmin(false);
      } finally {
        setCheckingAuth(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAdminStatus(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAdminStatus(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (checkingAuth || loadingSaves) {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Verifying security credentials...</div>;
  }

  // Block on save selection if no active save
  if (!activeSaveId) {
    return <SaveSelect />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'sans-serif' }}>

      {/* Navigation Bar Header Element */}
      <nav style={{ backgroundColor: '#1a202c', padding: '1rem', color: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem' }}>
            Silkcrest
          </Link>
          <Link to="/horses" style={{ color: '#cbd5e0', textDecoration: 'none' }}>Horses</Link>
          <Link to="/owners" style={{ color: '#cbd5e0', textDecoration: 'none' }}>Owners</Link>
          <Link to="/races" style={{ color: '#cbd5e0', textDecoration: 'none' }}>Races</Link>
          {isOwner && (
            <Link to="/portal" style={{ color: '#cbd5e0', textDecoration: 'none' }}>My Portal</Link>
          )}

          {/* Contextual Action Items Right-Aligned Cluster */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isAdmin && (
              <>
                <Link to="/horses/new" style={{ color: '#fff', textDecoration: 'none', backgroundColor: '#3182ce', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  + Horse
                </Link>
                <Link to="/owners/new" style={{ color: '#fff', textDecoration: 'none', backgroundColor: '#319795', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  + Owner
                </Link>
                <Link to="/races/new" style={{ color: '#fff', textDecoration: 'none', backgroundColor: '#805ad5', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  + Race
                </Link>
                <Link to="/results/new" style={{ color: '#fff', textDecoration: 'none', backgroundColor: '#dd6b20', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  + Result
                </Link>
                <Link to="/invite" style={{ color: '#fff', textDecoration: 'none', backgroundColor: '#dd6b20', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  Invite
                </Link>
              </>
            )}

            {/* Save switcher — dropdown when multiple saves, label when only one */}
            {saves.length > 1 ? (
              <select
                value={activeSaveId}
                onChange={e => {
                  const save = saves.find(s => s.id === e.target.value);
                  if (save) setSave(save);
                }}
                style={{ backgroundColor: '#2d3748', color: '#fff', border: '1px solid #4a5568', borderRadius: '4px', padding: '0.4rem 0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {saves.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>{activeSaveName}</span>
            )}

            {isLoggedIn && (
              <button
                onClick={handleLogout}
                style={{ backgroundColor: '#e53e3e', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Core Main Application Content Layout */}
      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/horses" element={<HorseDirectory />} />
          <Route path="/horses/:id" element={<HorseDetail isAdmin={isAdmin}/>} />
          <Route path="/races" element={<RaceDirectory />} />
          <Route path="/login" element={<Login />} />
          <Route path="/owners" element={<OwnerList />} />
          <Route path="/owners/:id" element={<OwnerDetail isAdmin={isAdmin}/>} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/portal" element={<OwnerPortal />} />
          <Route path="/signin" element={<OwnerSignin />} />

          {/* Guarded Admin Form Access Paths */}
          <Route path="/horses/new" element={isAdmin ? <AddHorse /> : <Navigate to="/horses" replace />} />
          <Route path="/horses/:id/edit" element={isAdmin ? <AddHorse /> : <Navigate to="/horses" replace />} />
          <Route path="/owners/new" element={isAdmin ? <AddOwner /> : <Navigate to="/owners" replace />} />
          <Route path="/owners/:id/edit" element={isAdmin ? <AddOwner /> : <Navigate to="/owners" replace />} />
          <Route path="/races/new" element={isAdmin ? <AddRace /> : <Navigate to="/races" replace />} />
          <Route path="/races/:id/edit" element={isAdmin ? <AddRace /> : <Navigate to="/races" replace />} />
          <Route path="/results/new" element={isAdmin ? <AddResult /> : <Navigate to="/races" replace />} />
          <Route path="/invite" element={<InvitePage />} />
        </Routes>
      </main>

    </div>
  );
}

function App() {
  return (
    <Router>
      <SaveProvider>
        <AppShell />
      </SaveProvider>
    </Router>
  );
}

export default App;