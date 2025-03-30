import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../components/pages/LandingPage';
import { Auth } from '../components/Auth';
import { ChatHome } from '../components/pages/ChatHome';
import { CreateChat } from '../components/CreateChat';
import { CallLogs } from '../components/CallLogs';
import { Settings } from '../components/Settings';
import { UserSetup } from '../components/UserSetup';
import { ChatRoom } from '../components/ChatRoom';
import { Profile } from '../components/Profile';
import { ProtectedRoute } from './ProtectedRoute';
import { Layout } from '../components/layout/Layout';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Layout>
              <ChatHome />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <CreateChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/call-logs"
        element={
          <ProtectedRoute>
            <Layout>
              <CallLogs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/join/:chatId"
        element={
          <ProtectedRoute>
            <Layout>
              <UserSetup />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:chatId"
        element={
          <ProtectedRoute>
            <Layout>
              <ChatRoom />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}