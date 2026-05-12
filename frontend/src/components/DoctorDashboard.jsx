import { useState, useEffect } from 'react';
import { Users, Calendar, MessageCircle, FileText, Send, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';

const mockPatients = [
  { id: 'PAT-8492', name: 'John Doe', age: 34, lastVisit: 'Oct 15, 2023' },
  { id: 'PAT-1029', name: 'Jane Smith', age: 28, lastVisit: 'Oct 20, 2023' },
];

const mockActivityData = [
  { name: 'Mon', steps: 4000, exercise: 0.5, water: 4 },
  { name: 'Tue', steps: 6000, exercise: 1, water: 6 },
  { name: 'Wed', steps: 8000, exercise: 1.5, water: 8 },
  { name: 'Thu', steps: 7500, exercise: 1, water: 7 },
  { name: 'Fri', steps: 10000, exercise: 2, water: 8 },
  { name: 'Sat', steps: 12000, exercise: 2.5, water: 10 },
  { name: 'Sun', steps: 9000, exercise: 1, water: 8 },
];

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState('patients');
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [stompClient, setStompClient] = useState(null);

  const userId = 2; // Mocked doctor ID
  const patientId = 1; // Mocked patient ID

  useEffect(() => {
    // Fetch previous messages
    axios.get(`http://localhost:8081/api/chat/${userId}/${patientId}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error(err));

    // Initialize STOMP client
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8081/ws'),
      onConnect: () => {
        client.subscribe(`/user/${userId}/queue/messages`, (msg) => {
          const newMsg = JSON.parse(msg.body);
          setMessages((prev) => [...prev, newMsg]);
        });
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !stompClient) return;

    const chatDTO = {
      senderId: userId,
      receiverId: patientId,
      message: chatMessage
    };

    stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(chatDTO)
    });

    setChatMessage('');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        <span className="badge badge-confirmed">Dr. Smith</span>
      </div>

      <div className="flex gap-4 mb-4">
        <button className={`btn ${activeTab === 'patients' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('patients')}>
          <Users size={18} /> Patients
        </button>
        <button className={`btn ${activeTab === 'appointments' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('appointments')}>
          <Calendar size={18} /> Schedule
        </button>
        <button className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('chat')}>
          <MessageCircle size={18} /> Messages
        </button>
      </div>

      {activeTab === 'patients' && !selectedPatient && (
        <div className="card">
          <h2 className="card-title">My Patients</h2>
          <div className="grid grid-cols-2 gap-4">
            {mockPatients.map(patient => (
              <div key={patient.id} className="report-item cursor-pointer hover:border-primary" onClick={() => setSelectedPatient(patient)}>
                <div>
                  <p className="font-bold">{patient.name}</p>
                  <p className="text-secondary text-sm">ID: {patient.id} | Age: {patient.age}</p>
                </div>
                <button className="btn btn-outline btn-sm">View Record</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'patients' && selectedPatient && (
        <div>
          <button className="btn btn-outline mb-4" onClick={() => setSelectedPatient(null)}>
            &larr; Back to Patient List
          </button>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h2 className="card-title">Patient Profile: {selectedPatient.name}</h2>
              <div className="mb-4">
                <p><strong>Patient ID:</strong> {selectedPatient.id}</p>
                <p><strong>Age:</strong> {selectedPatient.age}</p>
                <p><strong>Last Visit:</strong> {selectedPatient.lastVisit}</p>
              </div>

              <h3 className="font-bold mb-2 mt-4 border-b pb-2">Uploaded Records</h3>
              <div className="report-item">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-primary" />
                  <span className="font-medium">Blood_Test_Results.pdf</span>
                </div>
                <button className="btn btn-outline btn-sm text-xs">View</button>
              </div>
            </div>

            <div className="card">
              <h2 className="card-title">Patient Activity Trends</h2>
              <div style={{ height: '250px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="steps" stroke="#4F46E5" activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="exercise" stroke="#10B981" />
                    <Line yAxisId="right" type="monotone" dataKey="water" stroke="#0ea5e9" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="card mt-4">
            <h2 className="card-title">Add Prescription / Suggestion</h2>
            <form>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows="4" placeholder="Enter prescription or suggestions here..."></textarea>
              </div>
              <button className="btn btn-primary">Save to Patient Record</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="card">
          <h2 className="card-title">Today's Schedule</h2>
          <div className="report-item">
            <div className="flex items-center gap-4">
              <div className="stat-icon"><Calendar size={24} /></div>
              <div>
                <p className="font-bold">10:00 AM - John Doe</p>
                <p className="text-secondary text-sm">Routine Checkup</p>
              </div>
            </div>
            <button className="btn btn-primary">Start Consultation</button>
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="card">
          <h2 className="card-title">Chat with Patient: John Doe</h2>
          <div className="chat-container">
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.sender?.id === userId ? 'sent' : 'received'}`}>
                  {msg.message}
                </div>
              ))}
            </div>
            <form className="chat-input" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                placeholder="Type your message..." 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
