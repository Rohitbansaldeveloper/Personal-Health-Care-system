import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, User, Activity } from 'lucide-react';
import axios from 'axios';

export default function Auth({ role }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    id: '' // For doctors
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // We use a relative path /api to ensure it works correctly in CI/CD inside Kubernetes 
    // where NGINX acts as a proxy, or use the direct host if testing locally without proxy.
    // Given the CI/CD requirements, if running directly we point to localhost:8081.
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8081' : '';

    try {
      if (isLogin) {
        const response = await axios.post(`${baseUrl}/api/auth/login`, {
          email: formData.email,
          password: formData.password,
          role: role.toUpperCase()
        });
        
        const user = response.data;
        if (user.role !== role.toUpperCase()) {
          setError(`Access denied. You are registered as a ${user.role}, not a ${role.toUpperCase()}.`);
          return;
        }
        
        localStorage.setItem('user', JSON.stringify(user));
        navigate(role === 'patient' ? '/patient' : '/doctor');
      } else {
        const payload = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: role.toUpperCase(),
          medicalLicenseId: role === 'doctor' ? formData.id : null
        };
        
        const response = await axios.post(`${baseUrl}/api/auth/register`, payload);
        const user = response.data;
        
        localStorage.setItem('user', JSON.stringify(user));
        navigate(role === 'patient' ? '/patient' : '/doctor');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(typeof err.response.data === 'string' ? err.response.data : 'Authentication failed');
      } else {
        setError('Connection failed. Ensure the backend is running.');
      }
    }
  };

  return (
    <div className="flex justify-between items-center" style={{ minHeight: '70vh', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
        <div className="text-center mb-6">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: role === 'patient' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%' }}>
              {role === 'patient' ? <User size={40} style={{ color: 'var(--primary)' }} /> : <Activity size={40} style={{ color: 'var(--secondary)' }} />}
            </div>
          </div>
          <h2 className="card-title" style={{ justifyContent: 'center', border: 'none', marginBottom: '0.5rem', fontSize: '1.75rem' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {role === 'patient' ? 'Patient Portal Secure Login' : 'Doctor Portal Secure Login'}
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              {role === 'doctor' && (
               <div className="form-group">
                  <label className="form-label">Medical License ID</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={formData.id}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    placeholder="MD-12345"
                  />
                </div>
              )}
            </>
          )}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              required 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className={`btn w-full mt-4 justify-center ${role === 'patient' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.875rem', fontSize: '1.1rem' }}>
            {isLogin ? 'Sign In Securely' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              style={{ color: role === 'patient' ? 'var(--primary)' : 'var(--secondary)', fontWeight: '600', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0', fontSize: '0.9rem' }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Register now' : 'Sign in instead'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
