import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Activity, User, HeartPulse } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';

export const GOOGLE_CLIENT_ID = "977200040883-crgcj5d8ri0tsamim4l89716gq7hqjsv.apps.googleusercontent.com";

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/patient" element={<Auth role="patient" />} />
            <Route path="/auth/doctor" element={<Auth role="doctor" />} />
            <Route path="/patient/*" element={<PatientDashboard />} />
            <Route path="/doctor/*" element={<DoctorDashboard />} />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
