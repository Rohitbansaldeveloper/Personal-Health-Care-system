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

    return () => {
      if (client) client.deactivate();
    };
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'chat' && user) {
      // Mocked patient ID for demonstration
      const patientId = 1; 
      axios.get(`${baseUrl}/api/chat/${user.id}/${patientId}`)
        .then(res => {
          if (Array.isArray(res.data)) setMessages(res.data);
        })
        .catch(err => console.log('Chat fetch issue (might be normal if empty):', err.message));
    }
  }, [activeTab, user, baseUrl]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !stompClient || !user) return;

    const patientId = 1; // Fixed patient ID for demo purposes
    const messageObj = {
      senderId: user.id,
      receiverId: patientId,
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
              <div className="grid grid-cols-2" style={{ marginTop: '1.5rem' }}>
                <div 
                  className="report-item" 
                  style={{ flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer', borderColor: selectedPatient === 1 ? 'var(--secondary)' : '' }}
                  onClick={() => setSelectedPatient(1)}
                >
                  <div className="flex justify-between w-full items-center mb-2">
                    <h3 style={{ fontWeight: '600' }}>John Smith</h3>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>Active</span>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>ID: PT-10024 | Age: 45 | Male</p>
                </div>
                <div 
                  className="report-item" 
                  style={{ flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer', borderColor: selectedPatient === 2 ? 'var(--secondary)' : '' }}
                  onClick={() => setSelectedPatient(2)}
                >
                  <div className="flex justify-between w-full items-center mb-2">
                    <h3 style={{ fontWeight: '600' }}>Sarah Jenkins</h3>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>New</span>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>ID: PT-10025 | Age: 32 | Female</p>
                </div>
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
              <div className="report-item" style={{ marginTop: '1.5rem' }}>
                <div className="flex items-center gap-4">
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <strong style={{ display: 'block', color: 'var(--secondary)' }}>10:00</strong>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>AM</span>
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '600' }}>John Smith - Follow up</h3>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>Room 302</p>
                  </div>
                </div>
                <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>View Record</button>
              </div>
              <div className="report-item">
                <div className="flex items-center gap-4">
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <strong style={{ display: 'block', color: 'var(--secondary)' }}>11:30</strong>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>AM</span>
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '600' }}>Sarah Jenkins - Initial Consult</h3>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>Room 304</p>
                  </div>
                </div>
                <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>View Record</button>
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
