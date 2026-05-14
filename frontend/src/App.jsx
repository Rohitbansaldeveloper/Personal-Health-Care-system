import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Activity, User, HeartPulse } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import Auth from './components/Auth';

export const GOOGLE_CLIENT_ID = "977200040883-crgcj5d8ri0tsamim4l89716gq7hqjsv.apps.googleusercontent.com";

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <div className="app-container">
          <nav className="navbar">
            <Link to="/" className="navbar-brand">
              <HeartPulse size={36} />
              <span>HealthCare<span style={{color: "var(--text-main)"}}>Plus</span></span>
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
                    <h1>Next Generation Health Platform</h1>
                    <p>Welcome to HealthCare Plus. A beautifully designed, secure, and modern platform to manage appointments, track daily activities, and communicate directly with medical professionals.</p>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="card text-center">
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1.5rem', borderRadius: '50%' }}>
                          <User size={56} style={{ color: 'var(--primary)' }} />
                        </div>
                      </div>
                      <h2 className="card-title" style={{ justifyContent: 'center', borderBottom: 'none' }}>Patient Access</h2>
                      <p className="mb-6 text-muted">Access your health records securely, book appointments instantly, and track your daily wellness metrics.</p>
                      <Link to="/auth/patient" className="btn btn-primary w-full" style={{ padding: '1rem' }}>Enter Patient Portal</Link>
                    </div>
                    <div className="card text-center">
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '50%' }}>
                          <Activity size={56} style={{ color: 'var(--secondary)' }} />
                        </div>
                      </div>
                      <h2 className="card-title" style={{ justifyContent: 'center', borderBottom: 'none' }}>Doctor Access</h2>
                      <p className="mb-6 text-muted">Manage your patient roster, view comprehensive reports, and provide real-time consultations.</p>
                      <Link to="/auth/doctor" className="btn btn-secondary w-full" style={{ padding: '1rem' }}>Enter Doctor Portal</Link>
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
    </GoogleOAuthProvider>
  );
}

export default App;
