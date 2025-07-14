import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import Footer from './components/Footer';

import Login from './pages/Login';
import Register from './pages/Register';
// Auth Components (disabled but kept for reference)
import PasswordResetRequest from './components/Auth/PasswordResetRequest';
import PasswordReset from './components/Auth/PasswordReset';

// User Management Components
import UserList from './components/User/UserList';
import UserDetails from './components/User/UserDetails';

// Event Management Components
import EventForm from './components/Event/EventForm';
import EventList from './components/Event/EventList';

// Ticket Management Components
import TicketForm from './components/Ticket/TicketForm';
import TicketList from './components/Ticket/TicketList';
import TicketDetails from './components/Ticket/TicketDetails';

// Order Management Components
import OrderForm from './components/Order/OrderForm';
import OrderHistory from './components/Order/OrderHistory';
import OrderDetails from './components/Order/OrderDetails';

// Scanner Components
import ScannerInterface from './components/Scanner/ScannerInterface';
import AddScanner from './components/Scanner/AddScanner';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-secondary-900 text-white">
          <Navbar />
          <main className="relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetails />} />
              
              {/* Auth routes (disabled but kept for reference) */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/password-reset-request" element={<PasswordResetRequest />} />
              <Route path="/password-reset" element={<PasswordReset />} />
              
              {/* Dashboard Routes - No authentication required */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Admin Routes - No authentication required */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserList />} />
              <Route path="/admin/users/:id" element={<UserDetails />} />
              <Route path="/admin/scanners" element={<AddScanner />} />
              
              {/* Organizer Routes - No authentication required */}
              <Route path="/organizer" element={<OrganizerDashboard />} />
              <Route path="/create-event" element={<CreateEvent />} />
              <Route path="/events/create" element={<EventForm />} />
              <Route path="/events/:id/edit" element={<EventForm />} />
              <Route path="/events/:id/tickets" element={<TicketList />} />
              <Route path="/events/:eventId/tickets/create" element={<TicketForm />} />
              <Route path="/tickets/:id" element={<TicketDetails />} />
              
              {/* Customer Routes - No authentication required */}
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/events/:id/book" element={<OrderForm />} />
              
              {/* Scanner Routes - No authentication required */}
              <Route path="/scanner" element={<ScannerInterface />} />
            </Routes>
          </main>
          <Footer />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #475569',
                borderRadius: '12px',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;