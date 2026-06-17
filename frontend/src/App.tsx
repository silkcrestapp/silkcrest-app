import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './utils/supabaseClient';

// Core Directory & Detail Page Imports
import Home from './pages/Home';
import HorseDirectory from './pages/HorseDirectory';
import HorseDetail from './pages/HorseDetail';
import RaceDirectory from './pages/RaceDirectory';
import Login from './pages/Login';

// Administrative Creation Form Page Imports
import AddHorse from './pages/AddHorse';
import AddOwner from './pages/AddOwner';
import AddRace from './pages/AddRace';
import AddResult from './pages/AddResult';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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
          console.error("Supabase Query Error:", error.message);
          setIsAdmin(false);
        } else {
          setIsAdmin(data && data.length === 1);
        }
      } catch (err) {
        console.error("Critical Auth Exception:", err);
        setIsAdmin(false);
      } finally {
        setCheckingAuth(false);
      }
    }

    // Initialize session state on component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAdminStatus(session?.user ?? null);
    });

    // Listen for global auth state transitions (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAdminStatus(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/horses';
  }

  if (checkingAuth) {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Verifying security credentials...</div>;
  }

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'sans-serif' }}>
        
        {/* Navigation Bar Header Element */}
        <nav style={{ backgroundColor: '#1a202c', padding: '1rem', color: '#fff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem' }}>
              Silkcrest
            </Link>
            <Link to="/horses" style={{ color: '#cbd5e0', textDecoration: 'none' }}>Horses</Link>
            <Link to="/races" style={{ color: '#cbd5e0', textDecoration: 'none' }}>Races</Link>
            
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
                </>
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
            <Route path="/horses/:id" element={<HorseDetail />} />
            <Route path="/races" element={<RaceDirectory />} />
            <Route path="/login" element={<Login />} />
            
            {/* Guarded Admin Form Access Paths */}
            <Route path="/horses/new" element={isAdmin ? <AddHorse /> : <Navigate to="/horses" replace />} />
            <Route path="/owners/new" element={isAdmin ? <AddOwner /> : <Navigate to="/horses" replace />} />
            <Route path="/races/new" element={isAdmin ? <AddRace /> : <Navigate to="/races" replace />} />
            <Route path="/results/new" element={isAdmin ? <AddResult /> : <Navigate to="/races" replace />} />
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;