import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CalendarCheck, User } from 'lucide-react';

const tabs = [
  { label: 'Beranda', icon: Home, path: '/home' },
  { label: 'Pemesanan', icon: CalendarCheck, path: '/bookings' },
  { label: 'Profil', icon: User, path: '/profile' },
];

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around h-16 shadow-sticky z-50">
      {tabs.map((tab) => {
        const active = location.pathname === tab.path || (tab.path === '/home' && location.pathname === '/');
        return (
          <button
            key={tab.label}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${active ? 'text-primary' : 'text-ink-light'}`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
