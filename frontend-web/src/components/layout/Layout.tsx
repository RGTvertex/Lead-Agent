import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { cn } from '@/lib/utils';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={cn('transition-all duration-base ease-hubspot', collapsed ? 'ml-[60px]' : 'ml-[220px]')}>
        <Topbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
