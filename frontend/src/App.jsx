import { Routes, Route, Navigate } from 'react-router-dom';
import WebsiteLayout from './components/website/WebsiteLayout';
import ProtectedRoute from './components/app/ProtectedRoute';
import Home from './pages/website/Home';
import Features from './pages/website/Features';
import About from './pages/website/About';
import Contact from './pages/website/Contact';
import Login from './pages/website/Login';
import Register from './pages/website/Register';
import Dashboard from './pages/app/Dashboard';
import Symptoms from './pages/app/Symptoms';
import Assistant from './pages/app/Assistant';
import Medications from './pages/app/Medications';
import Prescription from './pages/app/Prescription';
import Queue from './pages/app/Queue';
import Emergency from './pages/app/Emergency';
import Blood from './pages/app/Blood';
import Appointments from './pages/app/Appointments';

export default function App() {
  return (
    <Routes>
      <Route element={<WebsiteLayout />}>
        <Route index element={<Home />} />
        <Route path="features" element={<Features />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
      <Route path="/app" element={<ProtectedRoute />}>
        <Route index element={<Dashboard />} />
        <Route path="symptoms" element={<Symptoms />} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="medications" element={<Medications />} />
        <Route path="prescription" element={<Prescription />} />
        <Route path="queue" element={<Queue />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="blood" element={<Blood />} />
        <Route path="appointments" element={<Appointments />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
