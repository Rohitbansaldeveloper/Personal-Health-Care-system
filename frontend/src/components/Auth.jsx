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
    id: '' // For doctors (Medical ID)
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        const response = await axios.post('http://localhost:8081/api/auth/login', {
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
        
        const response = await axios.post('http://localhost:8081/api/auth/register', payload);
        const user = response.data;
        
        localStorage.setItem('user', JSON.stringify(user));
        navigate(role === 'patient' ? '/patient' : '/doctor');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(typeof err.response.data === 'string' ? err.response.data : 'Authentication failed');
      } else {
        setError('An error occurred during authentication. Is the backend running?');
      }
    }
  };

  return (
    <div className="flex justify-center items-center" style={{ minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            {role === 'patient' ? <User size={48} className="text-primary" /> : <Activity size={48} className="text-secondary" />}
          </div>
          <h2 className="text-2xl font-bold">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-secondary mt-1">
            {role === 'patient' ? 'Patient Portal' : 'Doctor Portal'}
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', border: '1px solid #f87171', color: '#b91c1c', borderRadius: '0.375rem', fontSize: '0.875rem', textAlign: 'center' }}>
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
            />
          </div>
          
          <button type="submit" className={`btn w-full mt-4 justify-center ${role === 'patient' ? 'btn-primary' : 'btn-secondary'}`}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-secondary">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              className="text-primary font-bold bg-transparent border-none cursor-pointer p-0"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign up here' : 'Sign in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
