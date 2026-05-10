import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Activity, User, HeartPulse } from 'lucide-react';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import Auth from './components/Auth';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <Link to="/" className="navbar-brand">
            <HeartPulse size={32} />
            HealthCare Plus
          </Link>
          <div className="navbar-links">
            <Link to="/auth/patient">Patient Portal</Link>
            <Link to="/auth/doctor">Doctor Portal</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <div>
                <div className="hero">
                  <h1>Your Health, Our Priority</h1>
                  <p>Welcome to HealthCare Plus. Manage your appointments, track your daily activities, and communicate with your doctors securely.</p>
                </div>
                <div className="grid grid-cols-2">
                  <div className="card text-center">
                    <User size={48} className="stat-icon" style={{ margin: '0 auto 1rem', width: '64px', height: '64px' }} />
                    <h2 className="card-title" style={{ justifyContent: 'center', borderBottom: 'none' }}>I am a Patient</h2>
                    <p className="mb-4 text-secondary">Access your health records, book appointments, and track your daily wellness.</p>
                    <Link to="/auth/patient" className="btn btn-primary">Login / Sign Up</Link>
                  </div>
                  <div className="card text-center">
                    <Activity size={48} className="stat-icon" style={{ margin: '0 auto 1rem', width: '64px', height: '64px' }} />
                    <h2 className="card-title" style={{ justifyContent: 'center', borderBottom: 'none' }}>I am a Doctor</h2>
                    <p className="mb-4 text-secondary">Manage your patients, view reports, and provide consultations online.</p>
                    <Link to="/auth/doctor" className="btn btn-secondary">Login / Sign Up</Link>
                  </div>
                </div>
              </div>
            } />
            <Route path="/auth/patient" element={<Auth role="patient" />} />
            <Route path="/auth/doctor" element={<Auth role="doctor" />} />
            <Route path="/patient/*" element={<PatientDashboard />} />
            <Route path="/doctor/*" element={<DoctorDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
