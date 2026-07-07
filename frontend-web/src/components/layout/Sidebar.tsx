import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, CheckSquare,
  FileText, ChevronLeft, ChevronRight, Settings, User as UserIcon, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps { collapsed: boolean; onToggle: () => void; }

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/campaigns/new', icon: FileText, label: 'New Campaign' },
  { to: '/dashboard/leads', icon: Users, label: 'Lead Finder' },
  { to: '/dashboard/approvals', icon: CheckSquare, label: 'Approvals' },
  { to: '/dashboard/profile', icon: UserIcon, label: 'Profile' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
  { to: '/admin', icon: Shield, label: 'Admin Panel', adminOnly: true },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { isAdmin } = useAuth();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-canvas border-r border-ink-faint transition-all duration-base ease-hubspot',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-ink-faint">
        {collapsed ? (
          <div className="w-8 h-8 flex items-center justify-center mx-auto">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
            </div>
            <span className="text-lg font-bold text-ink tracking-tight">RGTvertex</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems
          .filter((i) => !i.adminOnly || isAdmin)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-fast min-h-[44px]',
                isActive
                  ? 'bg-brand-50 text-brand-500'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-1'
              )}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
      </nav>

      {/* Collapse */}
      <div className="p-2 border-t border-ink-faint">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-surface-1 text-ink-muted hover:text-ink min-h-[44px]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
