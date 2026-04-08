import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Columns3, Users as UsersIcon, Settings, ChevronLeft, ChevronRight, Menu, Truck, CheckSquare, UserCircle2, BarChart2, Megaphone, Share2, Tags, XSquare } from 'lucide-react';
import './layout.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-brand">
            <div className="brand-logo">
              <strong>M</strong>
            </div>
            <div className="brand-text">
              <div className="brand-name">
                <span>MAXPESA</span>
              </div>
              <span className="brand-subtext">LOCAÇÃO DE GUINDASTE</span>
              <span className="brand-suffix">CRM</span>
            </div>
          </div>
        )}
        <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      
      <div className="nav-links">
        <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} className="nav-icon" />
          <span className="nav-text">Dashboard</span>
        </NavLink>
        
        <NavLink to="/pipeline" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Columns3 size={20} className="nav-icon" />
          <span className="nav-text">Funil de Vendas</span>
        </NavLink>
        
        <NavLink to="/contacts" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <UsersIcon size={20} className="nav-icon" />
          <span className="nav-text">Empresa</span>
        </NavLink>

        <NavLink to="/tarefas" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <CheckSquare size={20} className="nav-icon" />
          <span className="nav-text">Tarefas</span>
        </NavLink>

        <NavLink to="/relatorios" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart2 size={20} className="nav-icon" />
          <span className="nav-text">Relatórios</span>
        </NavLink>
      </div>
      
      <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1rem 0' }}>
         <div style={{ display: 'flex', flexDirection: 'column' }}>
           <button 
             className="nav-item"
             style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: 'calc(100% - 1.5rem)' }}
             onClick={() => {
               setSettingsOpen(!settingsOpen);
               if (collapsed) setCollapsed(false);
             }}
           >
             <Settings size={20} className="nav-icon" />
             {!collapsed && <span className="nav-text">Configurações</span>}
             {!collapsed && <ChevronRight size={16} style={{ marginLeft: 'auto', transform: settingsOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />}
           </button>
           
           {settingsOpen && !collapsed && (
             <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '8px', margin: '0 0.75rem', overflow: 'hidden' }}>
               <NavLink to="/frota" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} style={{ margin: '0', borderRadius: '0', padding: '0.6rem 1rem 0.6rem 2.5rem' }}>
                 <Truck size={16} className="nav-icon" style={{ marginRight: '0.75rem' }} />
                 <span className="nav-text" style={{ fontSize: '0.85rem' }}>Produtos/Frota</span>
               </NavLink>
               <NavLink to="/campanhas" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} style={{ margin: '0', borderRadius: '0', padding: '0.6rem 1rem 0.6rem 2.5rem' }}>
                 <Megaphone size={16} className="nav-icon" style={{ marginRight: '0.75rem' }} />
                 <span className="nav-text" style={{ fontSize: '0.85rem' }}>Campanhas</span>
               </NavLink>
               <NavLink to="/fontes" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} style={{ margin: '0', borderRadius: '0', padding: '0.6rem 1rem 0.6rem 2.5rem' }}>
                 <Share2 size={16} className="nav-icon" style={{ marginRight: '0.75rem' }} />
                 <span className="nav-text" style={{ fontSize: '0.85rem' }}>Fontes de Lead</span>
               </NavLink>
               <NavLink to="/segmentos" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} style={{ margin: '0', borderRadius: '0', padding: '0.6rem 1rem 0.6rem 2.5rem' }}>
                 <Tags size={16} className="nav-icon" style={{ marginRight: '0.75rem' }} />
                 <span className="nav-text" style={{ fontSize: '0.85rem' }}>Segmentos</span>
               </NavLink>
               <NavLink to="/motivos-perda" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} style={{ margin: '0', borderRadius: '0', padding: '0.6rem 1rem 0.6rem 2.5rem' }}>
                 <XSquare size={16} className="nav-icon" style={{ marginRight: '0.75rem' }} />
                 <span className="nav-text" style={{ fontSize: '0.85rem' }}>Motivos de Perda</span>
               </NavLink>
               <NavLink to="/usuarios" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} style={{ margin: '0', borderRadius: '0', padding: '0.6rem 1rem 0.6rem 2.5rem' }}>
                 <UserCircle2 size={16} className="nav-icon" style={{ marginRight: '0.75rem' }} />
                 <span className="nav-text" style={{ fontSize: '0.85rem' }}>Usuários</span>
               </NavLink>
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

export default Sidebar;
