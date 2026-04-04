import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Order from './pages/Order';
import MyOrders from './pages/MyOrders';
import AdminDashboard from './pages/AdminDashboard';
import SplashScreen from './components/SplashScreen';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'motion/react';

// Protected Route Component
const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" />;
  if (role && user.role !== role) {
     return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  }

  // Prevent admin from accessing customer-only routes (routes without specific role assigned)
  if (!role && user.role === 'admin') {
     return <Navigate to="/admin" />;
  }

  return <>{children}</>;
};

const RootRoute = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  return <Navigate to="/dashboard" />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Customer Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/order" element={
          <ProtectedRoute>
            <Order />
          </ProtectedRoute>
        } />
        <Route path="/my-orders" element={
          <ProtectedRoute>
            <MyOrders />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Default Redirects */}
        <Route path="/" element={<RootRoute />} />
        <Route path="*" element={<RootRoute />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 overflow-x-hidden">
        <Navbar />
        <main className="max-w-7xl mx-auto py-8 px-4">
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  );
}

