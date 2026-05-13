import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, MessageCircle, FileText, Send, Activity, LogOut } from 'lucide-react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState('patients');
  const [user, setUser] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  
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
        client.subscribe(`/user/${parsedUser.id}/queue/messages`, (msg) => {
          const newMessage = JSON.parse(msg.body);
          setMessages(prev => [...prev, newMessage]);
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

    return () => {
      if (client) client.deactivate();
    };
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'chat' && user && selectedPatient) {
      axios.get(`${baseUrl}/api/chat/${user.id}/${selectedPatient.id}`)
        .then(res => {
          if (Array.isArray(res.data)) setMessages(res.data);
        })
        .catch(err => console.log('Chat fetch issue:', err.message));
    }
  }, [activeTab, user, selectedPatient, baseUrl]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !stompClient || !user || !selectedPatient) return;

    const messageObj = {
      senderId: user.id,
      receiverId: selectedPatient.id,
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
                    <FileText size={20} style={{ color: 'var(--secondary)' }}/> Detailed Medical History
                  </h3>
                  <p className="text-muted" style={{ lineHeight: '1.6' }}>Patient reports intermittent chest pain. ECG scheduled for next week. Current medications include Lisinopril 10mg daily.</p>
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
              <h2 className="card-title"><MessageCircle size={24} style={{ color: 'var(--secondary)' }}/> Patient Messages</h2>
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
        </div>
      </div>
    </div>
  );
}
