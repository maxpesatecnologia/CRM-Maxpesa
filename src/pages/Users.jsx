import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Plus, Search, Edit2, Trash2, X, Shield, User } from 'lucide-react';
import './Users.css';

const Users = () => {
  const { users, addUser, updateUser, deleteUser } = useCRM();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    perfil: 'Usuário',
    status: 'Ativo'
  });

  const filteredUsers = users.filter(item => 
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nome: item.nome,
        email: item.email || '',
        perfil: item.perfil || 'Usuário',
        status: item.status || 'Ativo'
      });
    } else {
      setEditingId(null);
      setFormData({
        nome: '',
        email: '',
        perfil: 'Usuário',
        status: 'Ativo'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.email) return;

    if (editingId) {
      updateUser(editingId, formData);
    } else {
      addUser(formData);
    }
    
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário permanentemente?')) {
      deleteUser(id);
    }
  };

  return (
    <div className="users-wrapper">
      <div className="users-header">
        <div>
          <h1>Equipe / Usuários</h1>
          <p>Gerencie o acesso dos vendedores e consultores ao sistema</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Cadastrar Vendedor
        </button>
      </div>

      <div className="users-actions">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="users-list-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Contato</th>
              <th>Perfil</th>
              <th>Status</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                 <tr key={user.id}>
                  <td>
                    <div className="user-name-cell">
                      <div className="user-avatar">
                        {user.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="user-name">{user.nome}</span>
                    </div>
                  </td>
                  <td className="text-muted">{user.email}</td>
                  <td>
                    {user.perfil === 'Administrador' ? (
                       <span className="badge badge-admin"><Shield size={12} style={{marginRight: '4px'}}/> Administrador</span>
                    ) : (
                       <span className="badge badge-user"><User size={12} style={{marginRight: '4px'}}/> Usuário</span>
                    )}
                  </td>
                  <td>
                    {user.status === 'Ativo' ? (
                      <span className="badge badge-active">Ativo</span>
                    ) : (
                      <span className="badge badge-inactive">Inativo</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon text-muted" onClick={() => handleOpenModal(user)} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon text-danger" onClick={() => handleDelete(user.id)} title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
               <tr>
                <td colSpan="5" className="empty-state">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Cadastro de Usuario */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Vendedor' : 'Novo Vendedor'}</h2>
              <button type="button" onClick={handleCloseModal} className="close-btn"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="users-form">
              <div className="form-group">
                <label>Nome Completo *</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Carlos Silva"
                  required
                />
              </div>

              <div className="form-group">
                <label>E-mail *</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="exemplo@empresa.com.br"
                  required
                />
              </div>

              <div className="form-row">
                 <div className="form-group flex-1">
                   <label>Perfil de Acesso</label>
                   <select 
                     value={formData.perfil}
                     onChange={(e) => setFormData({...formData, perfil: e.target.value})}
                   >
                     <option value="Usuário">Usuário Padrão</option>
                     <option value="Administrador">Administrador</option>
                   </select>
                 </div>

                 <div className="form-group flex-1">
                   <label>Status</label>
                   <select 
                     value={formData.status}
                     onChange={(e) => setFormData({...formData, status: e.target.value})}
                   >
                     <option value="Ativo">Acesso Ativo</option>
                     <option value="Inativo">Acesso Bloqueado</option>
                   </select>
                 </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
