# 🏥 HealthCare Plus - Next Generation Health Management System

HealthCare Plus is a premium, full-stack health management platform designed with a modern **Glassmorphism UI** and enterprise-grade infrastructure. It bridges the gap between patients and doctors through real-time communication, automated health tracking, and secure record management.

![Dashboard Mockup](https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200)

## ✨ Key Features

### 🚀 Modern Engineering
- **Glassmorphism UI**: A stunning, responsive interface built with React and Vanilla CSS for a premium feel.
- **Real-time Consultation**: Low-latency chat powered by **WebSockets (STOMP/SockJS)** over TCP for instant doctor-patient communication.
- **Wearable Integration**: Direct sync with **Google Fit API** to automatically track steps, exercise hours, and hydration.
- **Interactive Analytics**: Dynamic health improvement graphs using **Recharts**.

### 🛠 Enterprise CI/CD Pipeline
- **Dockerized**: Fully containerized environment using Docker and Docker Compose.
- **Kubernetes (K8s)**: Orchestrated deployment for high availability and scalability.
- **Jenkins Pipeline**: Automated build, test, and deployment cycles defined in `Jenkinsfile`.
- **Ansible Automation**: Automated server configuration and deployment playbooks.

### 📋 Healthcare Modules
- **Appointment System**: Dynamic booking flow with real-time status updates.
- **Medical Records**: Secure file upload and management for lab reports and prescriptions.
- **Activity Tracker**: Comprehensive wellness logging with automated wearable syncing.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Recharts, Lucide Icons |
| **Backend** | Spring Boot, Spring Security, Spring Data JPA |
| **Real-time** | WebSocket, STOMP, SockJS |
| **Database** | MySQL |
| **DevOps** | Docker, Kubernetes, Jenkins, Ansible |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Java 17+
- MySQL Server
- Docker & Kubernetes (optional for local dev)

### 2. Backend Setup
```bash
cd backend
./mvnw spring-boot:run
```
*Backend runs on `http://localhost:8081`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

### 4. Google Fit Integration
To enable live syncing:
1. Get your Client ID from [Google Cloud Console](https://console.cloud.google.com/).
2. Update `GOOGLE_CLIENT_ID` in `frontend/src/App.jsx`.

---

## 📸 Screen Gallery

> [!NOTE]
> The UI uses a custom-built design system with HSL colors and dynamic backdrops.

- **Patient Dashboard**: Real-time graph, appointment list, and report upload.
- **Doctor Portal**: Patient roster management and instant messaging.
- **Auth System**: Role-based access control (RBAC) with secure session management.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

Developed with ❤️ by [Rohit Bansal](https://github.com/Rohitbansaldeveloper)
