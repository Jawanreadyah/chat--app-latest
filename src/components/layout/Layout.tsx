import React from 'react';
import { Sidebar } from '../Sidebar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}