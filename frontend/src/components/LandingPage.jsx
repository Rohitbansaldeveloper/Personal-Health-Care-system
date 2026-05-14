import { useNavigate } from 'react-router-dom';
import { HeartPulse, Activity, Shield, Zap, Globe, ArrowRight, User, Stethoscope } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="logo-section">
          <HeartPulse className="pulse-icon" size={32} />
          <span className="logo-text">HealthCare Plus</span>
        </div>
        <div className="nav-links">
          <button onClick={() => navigate('/auth/patient')} className="btn btn-ghost">Patient Portal</button>
          <button onClick={() => navigate('/auth/doctor')} className="btn btn-secondary">Doctor Login</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="badge">Next Generation Healthcare</div>
          <h1>Empowering Your <br /><span className="text-gradient">Health Journey</span></h1>
          <p>The premium health management platform that connects you with top-tier doctors through real-time communication and AI-driven insights.</p>
          <div className="hero-btns">
            <button onClick={() => navigate('/auth/patient')} className="btn btn-primary btn-lg">
              Get Started Free <ArrowRight size={20} />
            </button>
            <button onClick={() => navigate('/auth/doctor')} className="btn btn-secondary btn-lg">
              Medical Professionals
            </button>
          </div>
          <div className="trust-badges">
            <div className="trust-item"><Shield size={16} /> Secure Data</div>
            <div className="trust-item"><Activity size={16} /> Real-time Sync</div>
            <div className="trust-item"><Zap size={16} /> Fast Access</div>
          </div>
        </div>
        <div className="hero-visual">
           <div className="glass-card-floating">
              <div className="floating-inner">
                <Activity className="text-primary" size={48} />
                <h3>Real-time Sync</h3>
                <p>Google Fit & Watch Integrated</p>
              </div>
           </div>
           <div className="glass-card-floating secondary">
              <div className="floating-inner">
                <Stethoscope className="text-secondary" size={48} />
                <h3>Expert Care</h3>
                <p>24/7 Digital Consultation</p>
              </div>
           </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2>Advanced Features for Modern Health</h2>
          <p>Everything you need to manage your wellness in one beautiful dashboard.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><Globe size={24} /></div>
            <h3>Universal Access</h3>
            <p>Access your medical records and consult doctors from anywhere in the world.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Activity size={24} /></div>
            <h3>Wearable Sync</h3>
            <p>Seamlessly connect with Google Fit, Samsung Health, and Apple Health devices.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Shield size={24} /></div>
            <h3>HIPAA Ready</h3>
            <p>Enterprise-grade encryption keeps your medical data private and secure.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo-section">
              <HeartPulse size={24} />
              <span>HealthCare Plus</span>
            </div>
            <p>Redefining medical care for the digital age.</p>
          </div>
          <div className="footer-links">
            <div>
              <h4>Product</h4>
              <p>Features</p>
              <p>Security</p>
            </div>
            <div>
              <h4>Portals</h4>
              <p onClick={() => navigate('/auth/patient')}>Patient</p>
              <p onClick={() => navigate('/auth/doctor')}>Doctor</p>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 HealthCare Plus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
