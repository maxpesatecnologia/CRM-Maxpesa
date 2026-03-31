import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';
import './layout.css';

const Header = () => {
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
        <div className="profile-avatar" title="Seu Perfil">
          U
        </div>
      </div>
    </header>
  );
};

export default Header;
