import { useNavigate } from 'react-router-dom';
import { useShuttleStore } from '@/store/shuttleStore';
import { ChevronRight, CreditCard, ShieldAlert, Bell, HelpCircle, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useShuttleStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    {
      icon: ShieldAlert,
      label: 'Riwayat Strike',
      detail: user.activeStrikes > 0 ? `${user.activeStrikes} aktif` : 'Tidak ada',
      color: user.activeStrikes > 0 ? 'text-destructive' : 'text-ink-light',
      onClick: () => navigate('/strikes'),
    },
    {
      icon: Bell,
      label: 'Notifikasi',
      detail: '',
      color: 'text-secondary',
      onClick: () => {},
    },
    {
      icon: HelpCircle,
      label: 'Bantuan',
      detail: '',
      color: 'text-ink-light',
      onClick: () => {},
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="gradient-header px-5 pt-12 pb-8 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-card/20 flex items-center justify-center text-primary-foreground font-bold text-2xl mb-3">
          {user.name.charAt(0)}
        </div>
        <p className="text-primary-foreground font-bold text-lg">{user.name}</p>
        <p className="text-primary-foreground/70 text-caption mt-0.5">
          {user.nim} · {user.level}
        </p>
        <span className="mt-2 bg-card/20 text-primary-foreground text-[10px] font-semibold px-3 py-1 rounded-full capitalize">
          {user.role}
        </span>
      </div>

      <div className="px-5 -mt-4 space-y-4">
        <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-caption text-ink-light">Flazz Card</p>
            <p className="text-body font-semibold text-ink">{user.flazzCard}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card overflow-hidden divide-y divide-border">
          {links.map((link) => (
            <button
              key={link.label}
              onClick={link.onClick}
              className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-muted transition-colors"
            >
              <link.icon className={`w-5 h-5 ${link.color}`} />
              <span className="flex-1 text-body font-medium text-ink">{link.label}</span>
              {link.detail && (
                <span className={`text-caption font-medium ${link.color}`}>{link.detail}</span>
              )}
              <ChevronRight className="w-4 h-4 text-ink-light" />
            </button>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 text-destructive active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-body font-semibold">Keluar</span>
        </button>
      </div>
    </div>
  );
}
