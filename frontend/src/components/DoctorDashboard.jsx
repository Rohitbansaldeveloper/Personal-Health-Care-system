import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, MessageCircle, FileText, Send, Activity, LogOut } from 'lucide-react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
//rohit
export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState('patients');
  const [user, setUser] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedChatPatient, setSelectedChatPatient] = useState(null);
  const selectedChatPatientRef = useRef(null);

  useEffect(() => {
    selectedChatPatientRef.current = selectedChatPatient;
  }, [selectedChatPatient]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [selectedPatientRecords, setSelectedPatientRecords] = useState([]);
  const [selectedPatientActivities, setSelectedPatientActivities] = useState([]);
  
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const navigate = useNavigate();

  // Smart URL resolving for both local development and Kubernetes
  const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8081' : '';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/auth/doctor');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Initialize WebSocket connection for chat
    const client = new Client({
      webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
      onConnect: () => {
        client.subscribe(`/topic/messages/${parsedUser.id}`, (msg) => {
          const newMessage = JSON.parse(msg.body);
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            
            const activePat = selectedChatPatientRef.current;
            if (activePat && (newMessage.sender?.id === activePat.id || newMessage.receiver?.id === activePat.id)) {
              return [...prev, newMessage];
            }
            return prev;
          });
        });
      },
      debug: (str) => console.log(str)
    });
    
    client.activate();
    setStompClient(client);

    // Fetch real appointments and derive patients
    axios.get(`${baseUrl}/api/appointments/doctor/${parsedUser.id}`)
      .then(res => {
        setAppointments(res.data);
        // Extract unique patients from appointments
        const uniquePatients = [];
        const seenIds = new Set();
        res.data.forEach(apt => {
          if (apt.patient && !seenIds.has(apt.patient.id)) {
            seenIds.add(apt.patient.id);
            uniquePatients.push(apt.patient);
          }
        });
        setPatients(uniquePatients);
      })
      .catch(err => console.log('Could not load appointments/patients'));

    // Fetch all patients for the chat dropdown
    axios.get(`${baseUrl}/api/auth/patients`)
      .then(res => {
        setAllPatients(res.data);
        if (res.data.length > 0) setSelectedChatPatient(res.data[0]);
      })
      .catch(err => console.log('Could not load all patients'));

    return () => {
      if (client) client.deactivate();
    };
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'chat' && user && selectedChatPatient) {
      axios.get(`${baseUrl}/api/chat/${user.id}/${selectedChatPatient.id}`)
        .then(res => {
          if (Array.isArray(res.data)) setMessages(res.data);
        })
        .catch(err => console.log('Chat fetch issue:', err.message));
    }
  }, [activeTab, user, selectedChatPatient, baseUrl]);

  useEffect(() => {
    if (selectedPatient) {
      axios.get(`${baseUrl}/api/records/patient/${selectedPatient.id}`)
        .then(res => {
          setSelectedPatientRecords(Array.isArray(res.data) ? res.data : []);
        })
        .catch(err => console.log('Records fetch issue:', err.message));
        
      axios.get(`${baseUrl}/api/activity/patient/${selectedPatient.id}`)
        .then(res => {
          setSelectedPatientActivities(Array.isArray(res.data) ? res.data : []);
        })
        .catch(err => console.log('Activity fetch issue:', err.message));
    } else {
      setSelectedPatientRecords([]);
      setSelectedPatientActivities([]);
    }
  }, [selectedPatient, baseUrl]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !stompClient || !user || !selectedChatPatient) return;

    const messageObj = {
      senderId: user.id,
      receiverId: selectedChatPatient.id,
      message: chatMessage
    };

    stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(messageObj)
    });

    setChatMessage('');
  };

  if (!user) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="card-title" style={{ border: 'none', marginBottom: '0.25rem', fontSize: '2rem' }}>Doctor Dashboard</h1>
          <p className="text-muted">Welcome back, Dr. {user.name} ({user.medicalLicenseId || 'MD'})</p>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
        <div className="card" style={{ padding: '1rem', height: 'fit-content' }}>
          <div className="flex" style={{ flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              className={`btn ${activeTab === 'patients' ? 'btn-secondary' : 'btn-outline'}`}
              style={{ justifyContent: 'flex-start', border: activeTab === 'patients' ? 'none' : '' }}
              onClick={() => setActiveTab('patients')}
            >
              <Users size={20} /> My Patients
            </button>
            <button 
              className={`btn ${activeTab === 'appointments' ? 'btn-secondary' : 'btn-outline'}`}
              style={{ justifyContent: 'flex-start', border: activeTab === 'appointments' ? 'none' : '' }}
              onClick={() => setActiveTab('appointments')}
            >
              <Calendar size={20} /> Schedule
            </button>
            <button 
              className={`btn ${activeTab === 'chat' ? 'btn-secondary' : 'btn-outline'}`}
              style={{ justifyContent: 'flex-start', border: activeTab === 'chat' ? 'none' : '' }}
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle size={20} /> Messages
            </button>
            <button 
              className={`btn ${activeTab === 'analytics' ? 'btn-secondary' : 'btn-outline'}`}
              style={{ justifyContent: 'flex-start', border: activeTab === 'analytics' ? 'none' : '' }}
              onClick={() => setActiveTab('analytics')}
            >
              <Activity size={20} /> Analytics & Reports
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: '2.5rem' }}>
          {activeTab === 'patients' && (
            <div>
              <h2 className="card-title"><Users size={24} style={{ color: 'var(--secondary)' }}/> Patient Roster</h2>
              <div className="grid grid-cols-2" style={{ marginTop: '1.5rem', gap: '1rem' }}>
                {patients.length === 0 ? (
                  <p className="text-muted" style={{ gridColumn: '1 / -1' }}>No patients assigned yet.</p>
                ) : (
                  patients.map(p => (
                    <div 
                      key={p.id}
                      className="report-item" 
                      style={{ flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer', borderColor: selectedPatient?.id === p.id ? 'var(--secondary)' : '' }}
                      onClick={() => setSelectedPatient(p)}
                    >
                      <div className="flex justify-between w-full items-center mb-2">
                        <h3 style={{ fontWeight: '600' }}>{p.name}</h3>
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>Active</span>
                      </div>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>ID: PT-{p.id} | Email: {p.email}</p>
                    </div>
                  ))
                )}
              </div>
              
              {selectedPatient && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} style={{ color: 'var(--secondary)' }}/> Patient Medical Reports
                  </h3>
                  {selectedPatientRecords.length === 0 ? (
                    <p className="text-muted" style={{ lineHeight: '1.6' }}>No medical reports uploaded by this patient yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedPatientRecords.map(record => (
                        <div key={record.id} className="report-item" style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', marginBottom: '0.5rem' }}>
                          <div className="flex items-center gap-3">
                            <FileText size={20} style={{ color: 'var(--secondary)' }} />
                            <div>
                              <h4 style={{ fontWeight: '600', fontSize: '0.95rem' }}>{record.fileName}</h4>
                              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Uploaded: {new Date(record.uploadedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <a href={record.fileUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>View Report</a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div>
              <h2 className="card-title"><Calendar size={24} style={{ color: 'var(--secondary)' }}/> Today's Schedule</h2>
              <div style={{ marginTop: '1.5rem' }}>
                {appointments.length === 0 ? (
                  <p className="text-muted">No appointments scheduled for today.</p>
                ) : (
                  appointments.map(apt => (
                    <div key={apt.id} className="report-item">
                      <div className="flex items-center gap-4">
                        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
                          <strong style={{ display: 'block', color: 'var(--secondary)' }}>
                            {new Date(apt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </strong>
                        </div>
                        <div>
                          <h3 style={{ fontWeight: '600' }}>{apt.patient?.name || 'Patient'} - Consultation</h3>
                          <p className="text-muted" style={{ fontSize: '0.9rem' }}>{apt.notes || 'Routine Checkup'}</p>
                        </div>
                      </div>
                      <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }} onClick={() => {
                        setSelectedPatient(apt.patient);
                        const chatPat = allPatients.find(p => p.id === apt.patient.id);
                        if (chatPat) setSelectedChatPatient(chatPat);
                        setActiveTab('patients');
                      }}>View Patient</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="card-title" style={{ marginBottom: 0, border: 'none' }}><MessageCircle size={24} style={{ color: 'var(--secondary)' }}/> Patient Messages</h2>
                {allPatients.length > 0 && (
                  <select 
                    className="form-control" 
                    style={{ width: 'auto', minWidth: '200px' }}
                    value={selectedChatPatient?.id || ''}
                    onChange={(e) => {
                      const pat = allPatients.find(p => p.id === parseInt(e.target.value));
                      setSelectedChatPatient(pat);
                    }}
                  >
                    {allPatients.map(pat => (
                      <option key={pat.id} value={pat.id}>{pat.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="chat-container">
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div style={{ margin: 'auto', color: 'var(--text-muted)', textAlign: 'center' }}>
                      <MessageCircle size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                      <p>Select a patient to view messages.</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={msg.id || idx} className={`chat-message ${msg.sender?.id === user.id ? 'sent' : 'received'}`}
                           style={msg.sender?.id === user.id ? { background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-hover) 100%)' } : {}}>
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
                    placeholder="Type a secure response..."
                  />
                  <button type="submit" className="btn btn-secondary" style={{ border: 'none' }}>
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="card-title" style={{ marginBottom: 0, border: 'none' }}><Activity size={24} style={{ color: 'var(--secondary)' }}/> Patient Analytics & Reports</h2>
                {allPatients.length > 0 && (
                  <select 
                    className="form-control" 
                    style={{ width: 'auto', minWidth: '200px' }}
                    value={selectedPatient?.id || ''}
                    onChange={(e) => {
                      const pat = allPatients.find(p => p.id === parseInt(e.target.value));
                      setSelectedPatient(pat);
                    }}
                  >
                    <option value="" disabled>Select a Patient</option>
                    {allPatients.map(pat => (
                      <option key={pat.id} value={pat.id}>{pat.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {!selectedPatient ? (
                <div style={{ margin: '4rem auto', color: 'var(--text-muted)', textAlign: 'center' }}>
                  <Users size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                  <p>Select a patient from the dropdown to view their analytics and reports.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Medical Reports Section */}
                  <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={20} style={{ color: 'var(--secondary)' }}/> Uploaded Medical Reports
                    </h3>
                    {selectedPatientRecords.length === 0 ? (
                      <p className="text-muted" style={{ lineHeight: '1.6' }}>No medical reports uploaded by this patient.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {selectedPatientRecords.map(record => (
                          <div key={record.id} className="report-item" style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', marginBottom: '0.5rem' }}>
                            <div className="flex items-center gap-3">
                              <FileText size={20} style={{ color: 'var(--secondary)' }} />
                              <div>
                                <h4 style={{ fontWeight: '600', fontSize: '0.95rem' }}>{record.fileName}</h4>
                                <p className="text-muted" style={{ fontSize: '0.8rem' }}>Uploaded: {new Date(record.uploadedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <a href={record.fileUrl} download={record.fileName} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Download Report</a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Patient Activity Logs Section */}
                  <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
                      <Activity size={20} /> Daily Activity Logs
                    </h3>
                    {selectedPatientActivities.length === 0 ? (
                      <p className="text-muted" style={{ lineHeight: '1.6' }}>No activity data logged by this patient.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                           <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                              <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Date</th>
                              <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Steps</th>
                              <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Exercise</th>
                              <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Water</th>
                              <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Heart Rate</th>
                              <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>BP</th>
                              <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>SpO2</th>
                              <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Stress</th>
                              <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Sleep</th>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', fontSize: '0.75rem', color: '#10b981' }}>
                              <td style={{ padding: '0.5rem 0.75rem', fontStyle: 'italic', fontWeight: '500' }}>Normal Range</td>
                              <td style={{ padding: '0.5rem 0.75rem', fontWeight: '500' }}>8k - 10k+</td>
                              <td style={{ padding: '0.5rem 0.75rem', fontWeight: '500' }}>0.5h - 1.0h+</td>
                              <td style={{ padding: '0.5rem 0.75rem', fontWeight: '500' }}>2.5 - 3.7 L</td>
                              <td style={{ padding: '0.5rem 0.75rem', fontWeight: '500' }}>60 - 100</td>
                              <td style={{ padding: '0.5rem 0.75rem', fontWeight: '500' }}>&lt;120 / &lt;80</td>
                              <td style={{ padding: '0.5rem 0.75rem', fontWeight: '500' }}>95% - 100%</td>
                              <td style={{ padding: '0.5rem 0.75rem', fontWeight: '500' }}>&lt;30</td>
                              <td style={{ padding: '0.5rem 0.75rem', fontWeight: '500' }}>7.0 - 9.0h</td>
                            </tr>
                          </thead>
                          <tbody>
                            {[...selectedPatientActivities].sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate)).map((act, idx) => {
                              const isAbnormal = (val, min, max) => val < min || val > max;
                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  <td style={{ padding: '0.75rem' }}>{new Date(act.activityDate).toLocaleDateString()}</td>
                                  <td style={{ padding: '0.75rem', color: isAbnormal(act.steps, 8000, 100000) ? '#fca5a5' : '#a7f3d0' }}>
                                    {act.steps}
                                  </td>
                                  <td style={{ padding: '0.75rem', color: isAbnormal(act.exerciseHours, 0.5, 24) ? '#fca5a5' : '#a7f3d0' }}>
                                    {act.exerciseHours}h
                                  </td>
                                  <td style={{ padding: '0.75rem', color: isAbnormal(act.waterGlasses, 2.5, 10) ? '#fca5a5' : '#a7f3d0' }}>
                                    {act.waterGlasses}L
                                  </td>
                                  <td style={{ padding: '0.75rem', color: isAbnormal(act.heartRate, 60, 100) ? '#fca5a5' : '#a7f3d0' }}>
                                    {act.heartRate} bpm
                                  </td>
                                  <td style={{ padding: '0.75rem', color: (act.bloodPressureSystolic >= 130 || act.bloodPressureDiastolic >= 85 || act.bloodPressureSystolic < 90) ? '#fca5a5' : '#a7f3d0' }}>
                                    {act.bloodPressureSystolic}/{act.bloodPressureDiastolic}
                                  </td>
                                  <td style={{ padding: '0.75rem', color: act.spo2 < 95 ? '#fca5a5' : '#a7f3d0' }}>
                                    {act.spo2}%
                                  </td>
                                  <td style={{ padding: '0.75rem', color: act.stressLevel > 30 ? '#fca5a5' : '#a7f3d0' }}>
                                    {act.stressLevel}
                                  </td>
                                  <td style={{ padding: '0.75rem', color: isAbnormal(act.sleepHours, 7, 9) ? '#fca5a5' : '#a7f3d0' }}>
                                    {act.sleepHours}h
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
