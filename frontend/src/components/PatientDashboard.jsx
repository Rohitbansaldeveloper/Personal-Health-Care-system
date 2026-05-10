import { useState, useEffect } from 'react';
import { Calendar, Upload, MessageCircle, Activity, Send, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';

const mockActivityData = [
  { name: 'Mon', steps: 4000, exercise: 0.5, water: 4 },
  { name: 'Tue', steps: 6000, exercise: 1, water: 6 },
  { name: 'Wed', steps: 8000, exercise: 1.5, water: 8 },
  { name: 'Thu', steps: 7500, exercise: 1, water: 7 },
  { name: 'Fri', steps: 10000, exercise: 2, water: 8 },
  { name: 'Sat', steps: 12000, exercise: 2.5, water: 10 },
  { name: 'Sun', steps: 9000, exercise: 1, water: 8 },
];

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('activity');
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [stompClient, setStompClient] = useState(null);

  const userId = 1; // Mocked patient ID
  const doctorId = 2; // Mocked doctor ID

  useEffect(() => {
    // Fetch previous messages
    axios.get(`http://localhost:8080/api/chat/${userId}/${doctorId}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error(err));

    // Initialize STOMP client
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
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

  const [activityForm, setActivityForm] = useState({ steps: '', exercise: '', water: '' });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !stompClient) return;

    const chatDTO = {
      senderId: userId,
      receiverId: doctorId,
      message: chatMessage
    };

    stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(chatDTO)
    });

    setChatMessage('');
  };

  const handleActivitySubmit = (e) => {
    e.preventDefault();
    alert('Activity logged successfully!');
    setActivityForm({ steps: '', exercise: '', water: '' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Patient Dashboard</h1>
        <span className="badge badge-confirmed">Patient ID: PAT-8492</span>
      </div>

      <div className="flex gap-4 mb-4">
        <button className={`btn ${activeTab === 'activity' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('activity')}>
          <Activity size={18} /> Daily Activity
        </button>
        <button className={`btn ${activeTab === 'appointments' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('appointments')}>
          <Calendar size={18} /> Appointments
        </button>
        <button className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('reports')}>
          <Upload size={18} /> Reports
        </button>
        <button className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('chat')}>
          <MessageCircle size={18} /> Doctor Chat
        </button>
      </div>

      {activeTab === 'activity' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <h2 className="card-title">Log Daily Activity</h2>
            <form onSubmit={handleActivitySubmit}>
              <div className="form-group">
                <label className="form-label">Number of Steps</label>
                <input type="number" className="form-control" value={activityForm.steps} onChange={e => setActivityForm({...activityForm, steps: e.target.value})} placeholder="e.g., 8000" required />
              </div>
              <div className="form-group">
                <label className="form-label">Hours of Exercise</label>
                <input type="number" step="0.1" className="form-control" value={activityForm.exercise} onChange={e => setActivityForm({...activityForm, exercise: e.target.value})} placeholder="e.g., 1.5" required />
              </div>
              <div className="form-group">
                <label className="form-label">Glasses of Water</label>
                <input type="number" className="form-control" value={activityForm.water} onChange={e => setActivityForm({...activityForm, water: e.target.value})} placeholder="e.g., 8" required />
              </div>
              <button type="submit" className="btn btn-primary w-full">Log Activity</button>
            </form>
          </div>
          <div className="card">
            <h2 className="card-title">Activity Trends</h2>
            <div style={{ height: '300px', width: '100%' }}>
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
      )}

      {activeTab === 'appointments' && (
        <div className="card">
          <h2 className="card-title">Book an Appointment</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Select Doctor</label>
              <select className="form-control">
                <option>Dr. Smith (Cardiology)</option>
                <option>Dr. Johnson (General)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Select Date & Time</label>
              <input type="datetime-local" className="form-control" />
            </div>
          </div>
          <button className="btn btn-primary mt-4">Confirm Booking</button>

          <h3 className="text-xl font-bold mt-8 mb-4">Upcoming Appointments</h3>
          <div className="report-item">
            <div className="flex items-center gap-4">
              <div className="stat-icon"><Calendar size={24} /></div>
              <div>
                <p className="font-bold">Dr. Smith</p>
                <p className="text-secondary text-sm">Tomorrow, 10:00 AM</p>
              </div>
            </div>
            <span className="badge badge-confirmed">Confirmed</span>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="card">
          <h2 className="card-title">Upload Reports</h2>
          <div className="file-upload-area mb-4">
            <Upload size={48} className="text-secondary mx-auto mb-2" />
            <p className="font-bold">Drag and drop files here</p>
            <p className="text-secondary text-sm mb-4">or</p>
            <button className="btn btn-outline">Browse Files</button>
            <p className="text-secondary text-xs mt-2">Supported formats: PDF, JPG, PNG</p>
          </div>

          <h3 className="text-xl font-bold mt-8 mb-4">My Documents</h3>
          <div className="report-item">
            <div className="flex items-center gap-4">
              <FileText size={24} className="text-primary" />
              <div>
                <p className="font-bold">Blood_Test_Results.pdf</p>
                <p className="text-secondary text-sm">Uploaded on Oct 24, 2023</p>
              </div>
            </div>
            <button className="btn btn-outline">View</button>
          </div>
          <div className="report-item">
            <div className="flex items-center gap-4">
              <FileText size={24} className="text-primary" />
              <div>
                <p className="font-bold">Prescription_DrSmith.pdf</p>
                <p className="text-secondary text-sm">Uploaded on Oct 10, 2023</p>
              </div>
            </div>
            <button className="btn btn-outline">View</button>
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="card">
          <h2 className="card-title">Chat with Doctor</h2>
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
