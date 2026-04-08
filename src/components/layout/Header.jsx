import React from 'react';
import { Search, Bell, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './layout.css';

const Header = () => {
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="header-search">
          <Search size={18} className="text-muted" />
          <input type="text" placeholder="Buscar empresas ou contatos..." />
        </div>
      </div>
      
      <div className="header-right">
        <button className="toggle-btn" title="Notificações">
          <Bell size={20} />
        </button>
        <button className="toggle-btn" title="Ajuda">
          <HelpCircle size={20} />
        </button>
        <div className="profile-container">
          <div className="profile-avatar" title={user?.email}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sair do CRM">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
