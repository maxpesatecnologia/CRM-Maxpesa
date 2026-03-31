import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Columns3, Users, Settings, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import './layout.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" style={{ padding: '0.5rem 1rem', height: '80px', alignItems: 'center' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <div style={{ 
              backgroundColor: '#E60000', 
              borderRadius: '8px', 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <strong style={{ color: 'white', fontSize: '20px', lineHeight: 1, fontFamily: 'Arial, sans-serif' }}>M</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '2px' }}>
              <div style={{ display: 'flex', fontWeight: 800, fontSize: '18px', letterSpacing: '0.5px', lineHeight: 1 }}>
                <span style={{ color: '#ff8a80' }}>MAX</span>
                <span style={{ color: '#E60000' }}>PESA</span>
              </div>
              <span style={{ color: '#718096', fontSize: '9px', fontWeight: 600, marginTop: '2px', letterSpacing: '0.2px' }}>
                LOCAÇÃO DE GUINDASTE
              </span>
              <span style={{ color: '#E60000', fontSize: '10px', fontWeight: 800, marginTop: '1px', letterSpacing: '1px' }}>
                CRM
              </span>
            </div>
          </div>
        )}
        <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)} style={{ marginLeft: collapsed ? 0 : 'auto' }}>
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
          <Users size={20} className="nav-icon" />
          <span className="nav-text">Contatos</span>
        </NavLink>
      </div>
      
      <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1rem 0' }}>
         <NavLink to="/settings" className="nav-item">
          <Settings size={20} className="nav-icon" />
          <span className="nav-text">Configurações</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
