import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initializeFromStorage } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      await initializeFromStorage();
      setIsLoading(false);
    };
    checkAuth();
  }, [initializeFromStorage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1b1e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}