import React, { useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Columns3, Building2, CheckSquare, BarChart2, X, Menu, UserCircle2, Users as UsersIcon } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import './layout.css';

const BOTTOM_NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipeline',   icon: Columns3,        label: 'Funil'     },
  { to: '/contacts',   icon: Building2,       label: 'Empresas'  },
  { to: '/tarefas',    icon: CheckSquare,     label: 'Tarefas'   },
  { to: '/relatorios', icon: BarChart2,       label: 'Relatórios'},
];

const Layout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer  = useCallback(() => setDrawerOpen(true),  []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="layout-wrapper">
      {/* Sidebar desktop */}
      <Sidebar onClose={closeDrawer} />

      {/* Overlay + Drawer mobile */}
      {drawerOpen && (
        <div className="mobile-overlay" onClick={closeDrawer}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <button className="drawer-close-btn" onClick={closeDrawer}>
              <X size={22} />
            </button>
            <Sidebar isMobileDrawer onClose={closeDrawer} />
          </div>
        </div>
      )}

      <div className="main-content">
        <Header onMenuClick={openDrawer} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation mobile */}
      <nav className="bottom-nav">
        {BOTTOM_NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button className="bottom-nav-item bottom-nav-more" onClick={openDrawer}>
          <Menu size={22} />
          <span>Mais</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
