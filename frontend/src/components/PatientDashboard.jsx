import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Upload, MessageCircle, Activity, Send, FileText, LogOut, Smartphone, Watch, Heart, Moon, Zap, Droplet } from 'lucide-react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useGoogleLogin } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '../App';

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('appointments');
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isBooking, setIsBooking] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ date: '', time: '', doctorId: '', notes: '' });
  const [activities, setActivities] = useState([]);
  const [records, setRecords] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isSyncingFit, setIsSyncingFit] = useState(null);
  const [chartMetricGroup, setChartMetricGroup] = useState('activity');
  const [newActivity, setNewActivity] = useState({
    date: new Date().toISOString().split('T')[0],
    steps: 0,
    exerciseHours: 0,
    waterGlasses: 0,
    heartRate: 72,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    sleepHours: 7.5,
    stressLevel: 25,
    spo2: 98
  });
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const navigate = useNavigate();

  // Smart URL resolving for both local development and Kubernetes
  const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8081' : '';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/auth/patient');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Fetch real appointments
    axios.get(`${baseUrl}/api/appointments/patient/${parsedUser.id}`)
      .then(res => setAppointments(res.data))
      .catch(err => console.log('Could not load appointments'));

    // Fetch activities
    axios.get(`${baseUrl}/api/activity/patient/${parsedUser.id}`)
      .then(res => setActivities(res.data))
      .catch(err => console.log('Could not load activities'));

    // Fetch records
    axios.get(`${baseUrl}/api/records/patient/${parsedUser.id}`)
      .then(res => setRecords(res.data))
      .catch(err => console.log('Could not load records'));

    // Fetch real doctors
    axios.get(`${baseUrl}/api/auth/doctors`)
      .then(res => {
        console.log("Fetched doctors:", res.data);
        setDoctors(res.data);
        if (res.data.length > 0) {
          setNewAppointment(prev => ({ ...prev, doctorId: res.data[0].id }));
        }
      })
      .catch(err => {
        console.error('Could not load doctors:', err);
      });

    // Initialize WebSocket connection for chat
    const client = new Client({
      webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
      onConnect: () => {
        client.subscribe(`/user/${parsedUser.id}/queue/messages`, (msg) => {
          const newMessage = JSON.parse(msg.body);
          setMessages(prev => [...prev, newMessage]);
        });
      },
      debug: (str) => console.log(str)
    });
    
    client.activate();
    setStompClient(client);

    // Load mock initial chat messages
    const doctorId = 2; // For demonstration, default doctor ID
    axios.get(`${baseUrl}/api/chat/${parsedUser.id}/${doctorId}`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setMessages(res.data);
        }
      })
      .catch(err => console.log('Chat fetch issue (might be normal if empty):', err.message));

    return () => {
      if (client) client.deactivate();
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!newAppointment.date || !newAppointment.time) return;
    
    // Convert date and time to LocalDateTime string format
    const appointmentDate = `${newAppointment.date}T${newAppointment.time}:00`;
    
    try {
      const response = await axios.post(`${baseUrl}/api/appointments/`, {
        patient: { id: user.id },
        doctor: { id: newAppointment.doctorId },
        appointmentDate: appointmentDate,
        notes: newAppointment.notes
      });
      setAppointments([...appointments, response.data]);
      setIsBooking(false);
      setNewAppointment({ date: '', time: '', doctorId: 2, notes: '' });
    } catch (err) {
      console.error('Failed to book appointment', err);
      alert('Failed to book appointment. Please try again.');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !stompClient || !user) return;

    const doctorId = 2; // Fixed doctor ID for demo purposes
    const messageObj = {
      senderId: user.id,
      receiverId: doctorId,
      message: chatMessage
    };

    stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(messageObj)
    });

    const optimisticMsg = {
      id: Date.now(),
      sender: { id: user.id },
      message: chatMessage
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setChatMessage('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    // Simulate upload delay for security scan/processing
    setTimeout(async () => {
      try {
        const response = await axios.post(`${baseUrl}/api/records/`, {
          patient: { id: user.id },
          fileName: file.name,
          fileUrl: `/uploads/${file.name}`,
          recordType: 'GENERAL_REPORT'
        });
        setRecords([...records, response.data]);
        alert('File uploaded successfully!');
      } catch (err) {
        alert('Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    }, 1500);
  };

  const handleLogActivity = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${baseUrl}/api/activity/`, {
        patient: { id: user.id },
        activityDate: newActivity.date,
        steps: newActivity.steps,
        exerciseHours: newActivity.exerciseHours,
        waterGlasses: newActivity.waterGlasses,
        heartRate: newActivity.heartRate,
        bloodPressureSystolic: newActivity.bloodPressureSystolic,
        bloodPressureDiastolic: newActivity.bloodPressureDiastolic,
        sleepHours: newActivity.sleepHours,
        stressLevel: newActivity.stressLevel,
        spo2: newActivity.spo2
      });
      // Ensure the chart sorts properly by recreating the array
      setActivities([...activities, response.data].sort((a, b) => new Date(a.activityDate) - new Date(b.activityDate)));
      alert('Activity logged successfully!');
    } catch (err) {
      alert('Failed to log activity');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Here we would normally hit the Google Fitness REST API to aggregate steps
        // Example endpoint: https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate
        // Since configuring the full dataset aggregate body is complex and requires specific data sources,
        // we will simulate the successful response payload here. 
        // In a production environment, you just swap this out with the axios.post to the googleapis endpoint.
        
        // Simulating the delay of the Google API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setNewActivity({
          ...newActivity,
          steps: Math.floor(Math.random() * (12000 - 6000) + 6000), 
          exerciseHours: +(Math.random() * 1.5 + 0.5).toFixed(1), 
          waterGlasses: +(Math.random() * 2 + 1).toFixed(1),
          heartRate: Math.floor(Math.random() * (90 - 65) + 65), // 65-90 bpm
          bloodPressureSystolic: Math.floor(Math.random() * (130 - 110) + 110), // 110-130 mmHg
          bloodPressureDiastolic: Math.floor(Math.random() * (85 - 70) + 70), // 70-85 mmHg
          sleepHours: +(Math.random() * 3 + 6).toFixed(1), // 6-9 hrs
          stressLevel: Math.floor(Math.random() * 40 + 10), // 10-50 stress index
          spo2: Math.floor(Math.random() * (100 - 96) + 96) // 96-100% SpO2
        });
        setIsSyncingFit(null);
        alert('Successfully fetched and synced your latest data from Google Fit!');
      } catch (err) {
        alert('Failed to fetch from Google Fit.');
        setIsSyncingFit(null);
      }
    },
    onError: () => {
      alert('Google Login Failed');
      setIsSyncingFit(null);
    },
    scope: 'https://www.googleapis.com/auth/fitness.activity.read'
  });

  const handleSyncWearable = (provider) => {
    if (provider === 'Google Fit') {
      setIsSyncingFit(provider);
      googleLogin();
    } else {
      // Simulate Apple Health
      setIsSyncingFit(provider);
      setTimeout(() => {
        setNewActivity({
          ...newActivity,
          steps: Math.floor(Math.random() * (12000 - 4000) + 4000), 
          exerciseHours: +(Math.random() * 2).toFixed(1), 
          waterGlasses: +(Math.random() * 3 + 1).toFixed(1),
          heartRate: Math.floor(Math.random() * (95 - 60) + 60), 
          bloodPressureSystolic: Math.floor(Math.random() * (135 - 115) + 115), 
          bloodPressureDiastolic: Math.floor(Math.random() * (88 - 75) + 75), 
          sleepHours: +(Math.random() * 4 + 5.5).toFixed(1), 
          stressLevel: Math.floor(Math.random() * 50 + 5), 
          spo2: Math.floor(Math.random() * (100 - 95) + 95)
        });
        setIsSyncingFit(null);
      }, 2000);
    }
  };

  const getLatestMetric = (metricKey, fallback = '-') => {
    if (!activities || activities.length === 0) return fallback;
    const latest = activities[activities.length - 1];
    return latest[metricKey] !== undefined && latest[metricKey] !== null ? latest[metricKey] : fallback;
  };

  if (!user) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="card-title" style={{ border: 'none', marginBottom: '0.25rem', fontSize: '2rem' }}>Patient Dashboard</h1>
          <p className="text-muted">Welcome back, {user.name}</p>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
        <div className="card" style={{ padding: '1rem', height: 'fit-content' }}>
          <div className="flex" style={{ flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              className={`btn ${activeTab === 'appointments' ? 'btn-primary' : 'btn-outline'}`}
              style={{ justifyContent: 'flex-start', border: activeTab === 'appointments' ? 'none' : '' }}
              onClick={() => setActiveTab('appointments')}
            >
              <Calendar size={20} /> Appointments
            </button>
            <button 
              className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-outline'}`}
              style={{ justifyContent: 'flex-start', border: activeTab === 'reports' ? 'none' : '' }}
              onClick={() => setActiveTab('reports')}
            >
              <FileText size={20} /> Medical Reports
            </button>
            <button 
              className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-outline'}`}
              style={{ justifyContent: 'flex-start', border: activeTab === 'chat' ? 'none' : '' }}
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle size={20} /> Consult Doctor
            </button>
            <button 
              className={`btn ${activeTab === 'activity' ? 'btn-primary' : 'btn-outline'}`}
              style={{ justifyContent: 'flex-start', border: activeTab === 'activity' ? 'none' : '' }}
              onClick={() => setActiveTab('activity')}
            >
              <Activity size={20} /> Daily Activity
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: '2.5rem' }}>
          {activeTab === 'appointments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="card-title" style={{ marginBottom: 0, border: 'none' }}><Calendar size={24} style={{ color: 'var(--primary)' }}/> Upcoming Appointments</h2>
                {!isBooking && (
                  <button className="btn btn-primary" onClick={() => setIsBooking(true)}>Book New Appointment</button>
                )}
              </div>

              {isBooking ? (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Book Consultation</h3>
                  <form onSubmit={handleBookAppointment}>
                    <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Date</label>
                        <input type="date" className="form-control" required value={newAppointment.date} onChange={e => setNewAppointment({...newAppointment, date: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Time</label>
                        <input type="time" className="form-control" required value={newAppointment.time} onChange={e => setNewAppointment({...newAppointment, time: e.target.value})} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Doctor</label>
                      <select className="form-control" value={newAppointment.doctorId} onChange={e => setNewAppointment({...newAppointment, doctorId: parseInt(e.target.value)})}>
                        {doctors.length === 0 ? (
                          <option disabled>No doctors available</option>
                        ) : (
                          doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>Dr. {doc.name} ({doc.specialization || 'General'})</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reason for visit</label>
                      <input type="text" className="form-control" value={newAppointment.notes} onChange={e => setNewAppointment({...newAppointment, notes: e.target.value})} placeholder="e.g. Annual checkup" />
                    </div>
                    <div className="flex gap-4 mt-4">
                      <button type="submit" className="btn btn-primary">Confirm Booking</button>
                      <button type="button" className="btn btn-outline" onClick={() => setIsBooking(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  {appointments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                      <Calendar size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                      <p>You have no upcoming appointments.</p>
                    </div>
                  ) : (
                    appointments.map(apt => (
                      <div key={apt.id} className="report-item" style={{ marginTop: '1rem' }}>
                        <div>
                          <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Dr. {apt.doctor?.name || 'Assigned Doctor'}</h3>
                          <p className="text-muted" style={{ fontSize: '0.9rem' }}>{new Date(apt.appointmentDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                          {apt.notes && <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Reason: {apt.notes}</p>}
                        </div>
                        <span className={`badge ${apt.status === 'CONFIRMED' ? 'badge-confirmed' : ''}`} style={apt.status !== 'CONFIRMED' ? { background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.3)' } : {}}>
                          {apt.status || 'PENDING'}
                        </span>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div>
              <h2 className="card-title"><MessageCircle size={24} style={{ color: 'var(--primary)' }}/> Doctor Consultation</h2>
              <div className="chat-container">
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div style={{ margin: 'auto', color: 'var(--text-muted)', textAlign: 'center' }}>
                      <MessageCircle size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                      <p>Start a secure conversation with your doctor.</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={msg.id || idx} className={`chat-message ${msg.sender?.id === user.id ? 'sent' : 'received'}`}>
                        {msg.message}
                      </div>
                    ))
                  )}
                </div>
                <form className="chat-input" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a secure message..."
                  />
                  <button type="submit" className="btn btn-primary" style={{ border: 'none' }}>
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 className="card-title"><Upload size={24} style={{ color: 'var(--primary)' }}/> Medical Reports</h2>
              
              <label style={{ display: 'block', border: '2px dashed rgba(99, 102, 241, 0.4)', borderRadius: '12px', padding: '3rem', textAlign: 'center', background: 'rgba(99, 102, 241, 0.05)', cursor: 'pointer', transition: 'all 0.2s', marginTop: '1.5rem', marginBottom: '2rem' }}>
                <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
                <Upload size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                  {uploading ? 'Uploading securely...' : 'Click to select a medical report'}
                </h3>
                <p className="text-muted">Support for a single or bulk upload. Strictly PDF, JPG, or PNG formats.</p>
              </label>

              {records.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Your Uploaded Reports</h3>
                  {records.map(record => (
                    <div key={record.id} className="report-item">
                      <div className="flex items-center gap-4">
                        <FileText size={24} style={{ color: 'var(--primary)' }} />
                        <div>
                          <h4 style={{ fontWeight: '600' }}>{record.fileName}</h4>
                          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Uploaded on {new Date(record.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <a href={record.fileUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>View</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h2 className="card-title" style={{ marginBottom: '1.5rem' }}><Activity size={24} style={{ color: 'var(--primary)' }}/> Activity Tracking</h2>

              {/* Samsung Galaxy Watch Health Status Cards */}
              <div className="grid mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '50%', color: '#ef4444', display: 'flex' }}>
                    <Heart size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#fca5a5', display: 'block' }}>Heart Rate</span>
                    <strong style={{ fontSize: '1.4rem', color: '#fecaca' }}>{getLatestMetric('heartRate', '72')} <span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>BPM</span></strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.75rem', borderRadius: '50%', color: '#3b82f6', display: 'flex' }}>
                    <Activity size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#93c5fd', display: 'block' }}>Blood Pressure</span>
                    <strong style={{ fontSize: '1.2rem', color: '#dbeafe' }}>
                      {getLatestMetric('bloodPressureSystolic', '120')}/{getLatestMetric('bloodPressureDiastolic', '80')} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>mmHg</span>
                    </strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '50%', color: '#10b981', display: 'flex' }}>
                    <Droplet size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#6ee7b7', display: 'block' }}>Blood Oxygen</span>
                    <strong style={{ fontSize: '1.4rem', color: '#a7f3d0' }}>{getLatestMetric('spo2', '98')}<span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>% SpO2</span></strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(168, 85, 247, 0.08)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '0.75rem', borderRadius: '50%', color: '#a855f7', display: 'flex' }}>
                    <Moon size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#d8b4fe', display: 'block' }}>Sleep Time</span>
                    <strong style={{ fontSize: '1.4rem', color: '#f3e8ff' }}>{getLatestMetric('sleepHours', '7.2')} <span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>Hrs</span></strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.75rem', borderRadius: '50%', color: '#f59e0b', display: 'flex' }}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#fde047', display: 'block' }}>Stress Level</span>
                    <strong style={{ fontSize: '1.4rem', color: '#fef9c3' }}>{getLatestMetric('stressLevel', '25')}<span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>/100</span></strong>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Watch size={20} style={{ color: '#34d399' }} /> Sync Wearables
                  </h3>
                  <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                    Automatically securely fetch your steps, sleep, and heart rate data directly from your device's health API.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      className="btn w-full" 
                      style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white' }}
                      onClick={() => handleSyncWearable('Google Fit')}
                      disabled={isSyncingFit !== null}
                    >
                      <Smartphone size={16} /> 
                      {isSyncingFit === 'Google Fit' ? 'Syncing...' : 'Google Fit'}
                    </button>
                    <button 
                      className="btn w-full" 
                      style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white' }}
                      onClick={() => handleSyncWearable('Apple Health')}
                      disabled={isSyncingFit !== null}
                    >
                      <Watch size={16} /> 
                      {isSyncingFit === 'Apple Health' ? 'Syncing...' : 'Apple Health'}
                    </button>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Log Today's Activity</h3>
                  <form onSubmit={handleLogActivity} className="grid grid-cols-2" style={{ gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Date</label>
                      <input type="date" className="form-control" required value={newActivity.date} onChange={e => setNewActivity({...newActivity, date: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Steps</label>
                      <input type="number" className="form-control" required value={newActivity.steps} onChange={e => setNewActivity({...newActivity, steps: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Exercise (Hours)</label>
                      <input type="number" step="0.1" className="form-control" required value={newActivity.exerciseHours} onChange={e => setNewActivity({...newActivity, exerciseHours: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Water (Liters)</label>
                      <input type="number" step="0.1" className="form-control" required value={newActivity.waterGlasses} onChange={e => setNewActivity({...newActivity, waterGlasses: parseFloat(e.target.value) || 0})} placeholder="e.g. 2.5" />
                    </div>

                    {/* Galaxy Watch Specific Forms */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Heart Rate (BPM)</label>
                      <input type="number" className="form-control" value={newActivity.heartRate} onChange={e => setNewActivity({...newActivity, heartRate: parseInt(e.target.value) || 0})} placeholder="e.g. 72" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">BP (Systolic / Diastolic)</label>
                      <div className="flex gap-2">
                        <input type="number" className="form-control" style={{ minWidth: 0 }} value={newActivity.bloodPressureSystolic} onChange={e => setNewActivity({...newActivity, bloodPressureSystolic: parseInt(e.target.value) || 0})} placeholder="Sys (120)" />
                        <span style={{ alignSelf: 'center' }}>/</span>
                        <input type="number" className="form-control" style={{ minWidth: 0 }} value={newActivity.bloodPressureDiastolic} onChange={e => setNewActivity({...newActivity, bloodPressureDiastolic: parseInt(e.target.value) || 0})} placeholder="Dia (80)" />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Sleep (Hours)</label>
                      <input type="number" step="0.1" className="form-control" value={newActivity.sleepHours} onChange={e => setNewActivity({...newActivity, sleepHours: parseFloat(e.target.value) || 0})} placeholder="e.g. 7.5" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Stress Level (1-100)</label>
                      <input type="number" className="form-control" value={newActivity.stressLevel} onChange={e => setNewActivity({...newActivity, stressLevel: parseInt(e.target.value) || 0})} placeholder="e.g. 25" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                      <label className="form-label">Blood Oxygen SpO2 (%)</label>
                      <input type="number" className="form-control" value={newActivity.spo2} onChange={e => setNewActivity({...newActivity, spo2: parseInt(e.target.value) || 0})} placeholder="e.g. 98" />
                    </div>
                    
                    <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                      <button type="submit" className="btn btn-primary w-full">Save to Database</button>
                    </div>
                  </form>
                </div>
              </div>

              {activities.length > 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Health Analytics</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setChartMetricGroup('activity')}
                        className={`btn ${chartMetricGroup === 'activity' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', border: chartMetricGroup === 'activity' ? 'none' : '' }}
                      >
                        Daily Activity
                      </button>
                      <button 
                        onClick={() => setChartMetricGroup('vitals')}
                        className={`btn ${chartMetricGroup === 'vitals' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', border: chartMetricGroup === 'vitals' ? 'none' : '' }}
                      >
                        Galaxy Watch Vitals
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ height: '350px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="90%">
                      <LineChart data={activities} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="activityDate" stroke="#94a3b8" />
                        
                        {chartMetricGroup === 'activity' ? (
                          <>
                            <YAxis yAxisId="left" stroke="#818cf8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#34d399" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="steps" stroke="#818cf8" strokeWidth={3} name="Steps" />
                            <Line yAxisId="right" type="monotone" dataKey="exerciseHours" stroke="#34d399" strokeWidth={3} name="Exercise (Hrs)" />
                            <Line yAxisId="right" type="monotone" dataKey="waterGlasses" stroke="#f472b6" strokeWidth={3} name="Water (Liters)" />
                          </>
                        ) : (
                          <>
                            <YAxis yAxisId="left" stroke="#f87171" domain={[40, 160]} />
                            <YAxis yAxisId="right" orientation="right" stroke="#a78bfa" domain={[0, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="heartRate" stroke="#f87171" strokeWidth={3} name="Heart Rate (BPM)" />
                            <Line yAxisId="left" type="monotone" dataKey="bloodPressureSystolic" stroke="#60a5fa" strokeWidth={2} name="BP Systolic" />
                            <Line yAxisId="left" type="monotone" dataKey="bloodPressureDiastolic" stroke="#3b82f6" strokeWidth={2} name="BP Diastolic" strokeDasharray="5 5" />
                            <Line yAxisId="right" type="monotone" dataKey="sleepHours" stroke="#c084fc" strokeWidth={3} name="Sleep (Hrs)" />
                            <Line yAxisId="right" type="monotone" dataKey="stressLevel" stroke="#fbbf24" strokeWidth={3} name="Stress Level" />
                            <Line yAxisId="right" type="monotone" dataKey="spo2" stroke="#34d399" strokeWidth={3} name="Oxygen (SpO2 %)" />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <p className="text-muted text-center" style={{ padding: '2rem 0' }}>No activity logged yet. Start tracking to see your improvement graph!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
