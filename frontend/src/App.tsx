import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import HorseDirectory from './pages/HorseDirectory';
import HorseDetail from './pages/HorseDetail';
import RaceDirectory from './pages/RaceDirectory'; // Add this import

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'sans-serif' }}>
        {/* Navigation Bar */}
        <nav style={{ backgroundColor: '#1a202c', padding: '1rem', color: '#fff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem' }}>
              Silkcrest
            </Link>
            <Link to="/horses" style={{ color: '#cbd5e0', textDecoration: 'none' }}>Horses</Link>
            <Link to="/races" style={{ color: '#cbd5e0', textDecoration: 'none' }}>Races</Link> {/* Add this link */}
          </div>
        </nav>

        {/* Page Content */}
        <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/horses" element={<HorseDirectory />} />
            <Route path="/horses/:id" element={<HorseDetail />} />
            <Route path="/races" element={<RaceDirectory />} /> {/* Add this route */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;