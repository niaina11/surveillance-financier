import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Activity,
  Bell,
  FileText,
  BarChart2,
  LogOut,
  Users,
  MessageCircle
} from 'lucide-react';

export default function Sidebar({ page }) {
  const navigate = useNavigate();

  const userRole = localStorage.getItem('role') || 'AGENT';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['ADMIN', 'AGENT']
    },
    {
      id: 'operations',
      label: 'Opérations',
      icon: Activity,
      path: '/operations',
      roles: ['ADMIN', 'AGENT']
    },
    {
      id: 'parametres',
      label: 'Demandes',
      icon: FileText,
      path: '/parametres',
      roles: ['ADMIN', 'AGENT']
    },
    {
      id: 'agences',
      label: 'Agences',
      icon: Building2,
      path: '/agences',
      roles: ['ADMIN']
    },
    {
      id: 'alertes',
      label: 'Alertes',
      icon: Bell,
      path: '/alertes',
      roles: ['ADMIN']
    },
    {
      id: 'audit',
      label: 'Audit (Journal)',
      icon: FileText,
      path: '/audit',
      roles: ['ADMIN']
    },
    {
      id: 'rapports',
      label: 'Rapports',
      icon: BarChart2,
      path: '/rapports',
      roles: ['ADMIN']
    },
    {
      id: 'messagerie',
      label: 'Messagerie',
      icon: MessageCircle,
      path: '/messagerie',
      roles: ['ADMIN', 'AGENT']
    },
    {
      id: 'utilisateurs',
      label: 'Utilisateurs',
      icon: Users,
      path: '/utilisateur',
      roles: ['ADMIN']
    }
  ];

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('id_agence');

    navigate('/login', { replace: true });
  };

  // Filtrer les menus selon le rôle
  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(userRole)
  );

  return (
    <aside
      className="w-64 h-screen flex flex-col shadow-lg flex-shrink-0"
      style={{ backgroundColor: '#FFD100' }}
    >

      {/* =========================
          EN-TÊTE
      ========================== */}
      <div
        className="p-6 flex-shrink-0"
        style={{
          borderColor: 'rgba(0, 51, 160, 0.15)',
          borderBottomWidth: '1px'
        }}
      >
        <p
          className="font-display text-xs uppercase tracking-widest mb-1 font-bold"
          style={{ color: '#0033A0' }}
        >
          Système
        </p>

        <h1
          className="font-display text-lg font-black leading-tight"
          style={{ color: '#0033A0' }}
        >
          Surveillance Financière
        </h1>

        <p
          className="text-xs mt-1 font-medium opacity-80"
          style={{ color: '#0033A0' }}
        >
          Mode : {userRole}
        </p>
      </div>

      {/* =========================
          NAVIGATION
          Scrollable mais scrollbar cachée
      ========================== */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-4 sidebar-scroll">

        {filteredNavItems.map(
          ({ id, label, icon: Icon, badge, path }) => (
            <NavLink
              key={id}
              to={path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-6 py-3 text-sm font-semibold transition-all ${isActive
                  ? 'bg-[#0033A0] text-[#FFD100] border-r-4 border-[#002266]'
                  : 'text-[#0033A0] hover:bg-[#0033A0]/10'
                }`
              }
            >
              {/* Icône */}
              <Icon size={18} />

              {/* Texte */}
              <span className="flex-1 text-left">
                {label}
              </span>

              {/* Badge éventuel */}
              {badge && (
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {badge}
                </span>
              )}
            </NavLink>
          )
        )}

      </nav>

      {/* =========================
          DÉCONNEXION
          Toujours visible en bas
      ========================== */}
      <div
        className="p-4 flex-shrink-0"
        style={{
          borderColor: 'rgba(0, 51, 160, 0.15)',
          borderTopWidth: '1px'
        }}
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-600/10 rounded-lg transition"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>

      {/* =========================
          CSS POUR CACHER LA SCROLLBAR
      ========================== */}
      <style>
        {`
          .sidebar-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .sidebar-scroll::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

    </aside>
  );
}


