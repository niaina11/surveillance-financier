import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agences from './pages/Agences';
import Operations from './pages/Operations';
import Alertes from './pages/Alertes';
import Audit from './pages/Audit';
import Rapports from './pages/Rapports';
import Parametres from './pages/Parametres';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Messagerie from './pages/Messagerie';
import Utilisateurs from './pages/Utilisateurs';

// 1. Layout intelligent qui synchronise le titre du Header avec l'URL actuelle
function Layout({ children }) {
  const location = useLocation();
  
  // Extrait le nom de la page depuis l'URL (ex: "/agences" devient "agences")
  const currentPage = location.pathname.substring(1) || 'dashboard';

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar page={currentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header page={currentPage} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

// 2. Route Protégée pour restreindre l'accès selon le Token et le Rôle
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Si l'utilisateur n'a pas le bon rôle (ex: AGENT tente d'aller sur /agences), retour au dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'AGENT']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/operations" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'AGENT']}>
            <Operations />
          </ProtectedRoute>
        } />
        <Route path="/parametres" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'AGENT']}>
            <Parametres />
          </ProtectedRoute>
        } />
        <Route path="/agences" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Agences />
          </ProtectedRoute>
        } />
        <Route path="/agences" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Agences />
          </ProtectedRoute>
        } />
        <Route path="/messagerie" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'AGENT']}>
            <Messagerie />
          </ProtectedRoute>
        } />
        <Route path="/alertes" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Alertes />
          </ProtectedRoute>
        } />
        <Route path="/audit" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Audit />
          </ProtectedRoute>
        } />
        <Route path="/rapports" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Rapports />
          </ProtectedRoute>
        } />
        <Route path="/utilisateur" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Utilisateurs />
          </ProtectedRoute>
        } />

        {/* Gestion des redirections par défaut */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
