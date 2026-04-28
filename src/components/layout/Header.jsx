import React, { useState } from 'react';
import { Search, Bell, HelpCircle, LogOut, Settings, X, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import './layout.css';

const Header = () => {
  const { signOut, user } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    if (newPassword.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      alert("Senha atualizada com sucesso!");
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      alert("Erro ao atualizar senha: " + error.message);
    } finally {
      setLoading(false);
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
        <button className="settings-btn" title="Alterar Senha" onClick={() => setIsPasswordModalOpen(true)}>
          <Settings size={20} />
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

      {/* Modal de Troca de Senha */}
      {isPasswordModalOpen && (
        <div className="password-modal-overlay">
          <div className="password-modal-content">
            <div className="password-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={20} className="text-primary" />
                <h2>Alterar Senha</h2>
              </div>
              <button className="toggle-btn" onClick={() => setIsPasswordModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="password-form">
              <div className="form-group">
                <label>Nova Senha</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirmar Nova Senha</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                />
              </div>

              <div className="password-modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
